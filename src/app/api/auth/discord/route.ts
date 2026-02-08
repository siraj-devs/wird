import { NextRequest, NextResponse } from 'next/server';
import { generateState } from '@/lib/utils';
import { cookies } from 'next/headers';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
    return NextResponse.json(
      { error: 'Discord OAuth not configured' },
      { status: 500 }
    );
  }

  const state = generateState();
  const cookieStore = await cookies();
  cookieStore.set('discord_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email',
    state: state,
  });

  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  
  return NextResponse.redirect(authUrl);
}
