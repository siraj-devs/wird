import env from "@/env";
import { generateState } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const state = generateState();
  const cookieStore = await cookies();
  cookieStore.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify email guilds.join",
    state: state,
  });

  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
