import env from "@/env";
import { DISCORD_AUTH_ENABLED } from "@/consts";
import { generateToken } from "@/lib/auth";
import { createAuthSession, upsertConnection } from "@/lib/auth-db";
import { setAuthCookie } from "@/lib/auth-server";
import { fetchWithTimeout } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!DISCORD_AUTH_ENABLED) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state)
    return NextResponse.redirect(
      new URL("/login?error=invalid_request", request.url),
    );

  const cookieStore = await cookies();
  const storedState = cookieStore.get("discord_oauth_state")?.value;
  if (!storedState || storedState !== state)
    return NextResponse.redirect(
      new URL("/login?error=invalid_state", request.url),
    );

  cookieStore.delete("discord_oauth_state");

  try {
    const tokenResponse = await fetchWithTimeout(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: env.DISCORD_REDIRECT_URI,
        }),
      },
    );

    if (!tokenResponse.ok) throw new Error("Failed to exchange code for token");

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetchWithTimeout(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!userResponse.ok) throw new Error("Failed to fetch user info");

    const discordUser: DiscordUser = await userResponse.json();
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    const { connectionId, userId } = await upsertConnection({
      id: discordUser.id,
      type: "discord",
      name: discordUser.username,
      username: discordUser.username,
      avatar: avatarUrl,
    });

    const token = generateToken({
      connectionId,
      ...(userId ? { userId } : {}),
    });
    await setAuthCookie(token);
    await createAuthSession({ connectionId, userId, token });

    try {
      await fetchWithTimeout(
        `https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/${discordUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        },
      );
    } catch (error) {
      console.error("Failed to add user to Discord server:", error);
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Discord OAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=authentication_failed", request.url),
    );
  }
}
