import env from "@/env";
import { generateCodeChallenge, generateCodeVerifier, generateState } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const cookieStore = await cookies();
  const secure = env.NODE_ENV === "production";

  cookieStore.set("telegram_oauth_state", state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  cookieStore.set("telegram_code_verifier", codeVerifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: env.TELEGRAM_CLIENT_ID,
    redirect_uri: env.TELEGRAM_REDIRECT_URI,
    response_type: "code",
    scope: "openid profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(
    `https://oauth.telegram.org/auth?${params.toString()}`,
  );
}
