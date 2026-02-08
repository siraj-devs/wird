import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME!;

export async function GET(request: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_BOT_USERNAME) {
    return NextResponse.json(
      { error: 'Telegram OAuth not configured' },
      { status: 500 }
    );
  }

  // Generate a unique auth request ID
  const authId = crypto.randomBytes(16).toString('hex');
  const cookieStore = await cookies();
  
  cookieStore.set('telegram_auth_id', authId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // Redirect to Telegram login widget page
  const redirectUrl = new URL('/auth/telegram', request.url);
  redirectUrl.searchParams.set('auth_id', authId);
  
  return NextResponse.redirect(redirectUrl);
}
