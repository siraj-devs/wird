import env from "@/env";
import { generateToken } from "@/lib/auth";
import { createAuthSession, upsertConnection } from "@/lib/auth-db";
import { setAuthCookie } from "@/lib/auth-server";
import { fetchWithTimeout } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Telegram OIDC id_token payload (relevant claims)
interface TelegramIdToken {
  sub: string;       // Telegram user ID (as string)
  id: number;        // Telegram user ID (as number)
  name: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
  phone_number?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Minimal JWT decode (header.payload.signature) – no verification here,
// signature is verified by checking against Telegram's JWKS below.
function decodeJwtPayload(token: string): TelegramIdToken {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const payload = parts[1];
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, "base64url").toString("utf-8")) as TelegramIdToken;
}

// Verify id_token signature against Telegram's JWKS endpoint.
async function verifyTelegramIdToken(idToken: string): Promise<TelegramIdToken> {
  // 1. Fetch Telegram's public keys
  const jwksResponse = await fetchWithTimeout(
    "https://oauth.telegram.org/.well-known/jwks.json",
  );
  if (!jwksResponse.ok) throw new Error("Failed to fetch Telegram JWKS");

  interface JwksKey {
    kid: string;
    kty: string;
    alg: string;
    n: string;
    e: string;
    x?: string;
    y?: string;
    crv?: string;
  }
  const jwks = (await jwksResponse.json()) as { keys: JwksKey[] };

  // 2. Decode header to find kid
  const headerB64 = idToken.split(".")[0];
  const padded = headerB64 + "=".repeat((4 - (headerB64.length % 4)) % 4);
  const header = JSON.parse(
    Buffer.from(padded, "base64url").toString("utf-8"),
  ) as { kid?: string; alg: string };

  const jwk = header.kid
    ? jwks.keys.find((k) => k.kid === header.kid)
    : jwks.keys[0];

  if (!jwk) throw new Error("No matching JWK found for token kid");

  // 3. Import the public key and verify using Web Crypto
  const keyData = {
    kty: jwk.kty,
    ...(jwk.n && { n: jwk.n }),
    ...(jwk.e && { e: jwk.e }),
    ...(jwk.x && { x: jwk.x }),
    ...(jwk.y && { y: jwk.y }),
    ...(jwk.crv && { crv: jwk.crv }),
    alg: jwk.alg,
    ext: true,
  };

  let algorithm: RsaHashedImportParams | EcKeyImportParams;
  if (header.alg === "RS256") {
    algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  } else if (header.alg === "ES256") {
    algorithm = { name: "ECDSA", namedCurve: "P-256" };
  } else {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    keyData,
    algorithm,
    false,
    ["verify"],
  );

  const [headerPayload, signatureB64] = [
    idToken.split(".").slice(0, 2).join("."),
    idToken.split(".")[2],
  ];

  const signaturePadded =
    signatureB64 + "=".repeat((4 - (signatureB64.length % 4)) % 4);
  const signature = Buffer.from(signaturePadded, "base64url");
  const data = new TextEncoder().encode(headerPayload);

  const valid = await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  if (!valid) throw new Error("Invalid id_token signature");

  const payload = decodeJwtPayload(idToken);

  // 4. Verify standard claims
  if (payload.iss !== "https://oauth.telegram.org") {
    throw new Error("Invalid issuer");
  }
  if (String(payload.aud) !== env.TELEGRAM_CLIENT_ID) {
    throw new Error("Invalid audience");
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_request", request.url),
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("telegram_oauth_state")?.value;
  const codeVerifier = cookieStore.get("telegram_code_verifier")?.value;

  if (!storedState || storedState !== state || !codeVerifier) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_state", request.url),
    );
  }

  cookieStore.delete("telegram_oauth_state");
  cookieStore.delete("telegram_code_verifier");

  try {
    // Exchange code for tokens
    const credentials = Buffer.from(
      `${env.TELEGRAM_CLIENT_ID}:${env.TELEGRAM_CLIENT_SECRET}`,
    ).toString("base64");

    const tokenResponse = await fetchWithTimeout(
      "https://oauth.telegram.org/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: env.TELEGRAM_REDIRECT_URI,
          client_id: env.TELEGRAM_CLIENT_ID,
          code_verifier: codeVerifier,
        }),
      },
    );

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error("Telegram token exchange failed:", err);
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = (await tokenResponse.json()) as { id_token: string };
    const idToken = tokenData.id_token;

    if (!idToken) throw new Error("No id_token in Telegram response");

    // Verify and decode the id_token
    const telegramUser = await verifyTelegramIdToken(idToken);

    const username =
      telegramUser.preferred_username ??
      telegramUser.name.toLowerCase().replace(/\s+/g, "_");

    const { connectionId, userId } = await upsertConnection({
      id: String(telegramUser.sub),
      type: "telegram",
      name: telegramUser.name,
      username,
      avatar: telegramUser.picture ?? null,
    });

    const token = generateToken({
      connectionId,
      ...(userId ? { userId } : {}),
    });
    await setAuthCookie(token);
    await createAuthSession({ connectionId, userId, token });

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Telegram OIDC error:", error);
    return NextResponse.redirect(
      new URL("/login?error=authentication_failed", request.url),
    );
  }
}
