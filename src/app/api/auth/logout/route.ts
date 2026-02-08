import { NextRequest, NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await removeAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await removeAuthCookie();
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/login?error=logout_failed', request.url));
  }
}
