import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { fetchWithTimeout } from '@/lib/utils';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=invalid_request', request.url));
  }

  // Verify state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('discord_oauth_state')?.value;
  
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  // Clear state cookie
  cookieStore.delete('discord_oauth_state');

  try {
    // Exchange code for access token
    const tokenResponse = await fetchWithTimeout(
      'https://discord.com/api/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: DISCORD_REDIRECT_URI,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user info
    const userResponse = await fetchWithTimeout(
      'https://discord.com/api/users/@me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const discordUser: DiscordUser = await userResponse.json();

    console.log('Discord User:', discordUser);

    // Use admin client for database operations to bypass RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    // Check if user exists in database
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('provider_id', discordUser.id)
      .single();

    let userId: string;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id;
      await supabaseAdmin
        .from('users')
        .update({
          username: discordUser.username,
          avatar_url: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
          email: discordUser.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } else {
      // Create new user
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          username: discordUser.username,
          email: discordUser.email,
          avatar_url: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
          provider_id: discordUser.id,
        })
        .select()
        .single();

      if (error || !newUser) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create user');
      }

      userId = newUser.id;
    }

    // Generate JWT token
    const token = generateToken({
      userId: userId,
      username: discordUser.username,
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Store session in database
    await supabaseAdmin.from('sessions').insert({
      user_id: userId,
      token: token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=authentication_failed', request.url));
  }
}
