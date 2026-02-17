import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./auth";
import jwt from "jsonwebtoken";
import { ROLES } from "./roles";
import { redirect } from "next/navigation";

const TOKEN_COOKIE_NAME = "auth_token";

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  const env = await import("@/env").then((m) => m.default);
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(TOKEN_COOKIE_NAME);
  return cookie?.value || null;
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}

export async function getIdFromToken() {
  const token = (await cookies()).get(TOKEN_COOKIE_NAME)?.value!;
  const id = (jwt.decode(token) as JWTPayload)?.userId!;
  return id;
}

export async function checkRole(
  roles: ROLES[],
  init: { id?: string; user?: User } = {},
) {
  const { getUser } = await import("@/actions");
  const id = init.id ?? (await getIdFromToken());
  const user = init.user ?? (await getUser(id))!;
  if (!roles.includes(user.role)) redirect("/");
}
