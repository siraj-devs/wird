import { getUser } from "@/actions";
import { getIdFromToken } from "@/lib/auth";
import { ROLES } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = await getIdFromToken();
  const user = await getUser(id);

  if (!user) return NextResponse.redirect(new URL("/logout", request.url));

  if (user.role === ROLES.GUEST)
    return NextResponse.redirect(new URL("/requests", request.url));
  if (user.role === ROLES.MEMBER)
    return NextResponse.redirect(new URL("/tasks", request.url));
  if (user.role === ROLES.ADMIN || user.role === ROLES.OWNER)
    return NextResponse.redirect(new URL("/panel", request.url));

  return NextResponse.redirect(new URL("/logout", request.url));
}
