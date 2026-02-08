import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { generateToken, setAuthCookie } from '@/lib/auth';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

function verifyTelegramAuth(authData: TelegramAuthData): boolean {
  const { hash, ...data } = authData;
  
  // Create data check string
  const dataCheckString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key as keyof typeof data]}`)
    .join('\n');

  // Create secret key
  const secretKey = crypto
    .createHash('sha256')
    .update(TELEGRAM_BOT_TOKEN)
    .digest();

  // Calculate hash
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Verify hash and check if auth is not older than 1 day
  const isHashValid = calculatedHash === hash;
  const isAuthRecent = Date.now() / 1000 - authData.auth_date < 86400;

  return isHashValid && isAuthRecent;
}

export async function POST(request: NextRequest) {
  try {
    const authData: TelegramAuthData = await request.json();

    // Verify auth data
    if (!verifyTelegramAuth(authData)) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Verify auth_id cookie
    const cookieStore = await cookies();
    const storedAuthId = cookieStore.get('telegram_auth_id')?.value;
    
    if (!storedAuthId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Clear auth_id cookie
    cookieStore.delete('telegram_auth_id');

    const username = authData.username || `user_${authData.id}`;
    const fullName = `${authData.first_name}${authData.last_name ? ' ' + authData.last_name : ''}`;

    // Use admin client for database operations to bypass RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    // Check if user exists in database
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('provider', 'telegram')
      .eq('provider_id', authData.id.toString())
      .single();

    let userId: string;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id;
      await supabaseAdmin
        .from('users')
        .update({
          username: username,
          avatar_url: authData.photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } else {
      // Create new user
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          username: username,
          email: null,
          avatar_url: authData.photo_url || null,
          provider: 'telegram',
          provider_id: authData.id.toString(),
        })
        .select()
        .single();

      if (error || !newUser) {
        throw new Error('Failed to create user');
      }

      userId = newUser.id;
    }

    // Generate JWT token
    const token = generateToken({
      userId: userId,
      username: username,
      provider: 'telegram',
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Store session in database
    await supabaseAdmin.from('sessions').insert({
      user_id: userId,
      token: token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    console.error('Telegram OAuth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
