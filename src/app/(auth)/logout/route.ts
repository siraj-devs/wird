import { removeAuthCookie } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await removeAuthCookie();
    return NextResponse.redirect(new URL("/login", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=logout_failed", request.url),
    );
  }
}
