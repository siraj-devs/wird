import { removeAuthCookie } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  try {
    await removeAuthCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}

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
