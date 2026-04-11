import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "./auth";
import { ROLES } from "./roles";

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
  const token = cookieStore
    .getAll(TOKEN_COOKIE_NAME)
    .map((cookie) => cookie.value)
    .find((value) => value.length > 0);
  return token || null;
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
  const token = await getAuthToken();
  if (!token) throw new Error("No auth token");
  const decoded = jwt.decode(token) as JWTPayload | null;
  if (!decoded?.userId) throw new Error("Invalid auth token");
  const id = decoded.userId;
  return id;
}

export async function checkRole(
  roles: ROLES[],
  init: { id?: string; user?: User } = {},
) {
  const { getUser } = await import("@/actions");
  const id = init.id ?? (await getIdFromToken());
  const user = init.user ?? (await getUser(id))!;
  if (!roles.includes(user.role)) {
    if ([ROLES.NEWCOMER, ROLES.GUEST, ROLES.EXPELLED].includes(user.role))
      redirect("/");
    else if (user.role === ROLES.MEMBER || user.role === ROLES.ADMIN)
      redirect("/tasks");
    else if (user.role === ROLES.OWNER) redirect("/panel");
    else redirect("/logout");
  }
  return user;
}
