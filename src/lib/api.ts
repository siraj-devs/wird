import { NextRequest } from "next/server";
import { verifyToken } from "./auth";
import { ROLES } from "./roles";
import { supabaseAdmin } from "./supabase";

export class APIError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `API Error with status ${status}`);
    this.status = status;
  }
}

export async function checkAuth(
  request: NextRequest,
  ...roles: role[]
): Promise<User> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) throw new APIError(401, "Unauthorized - No token provided");

  const payload = verifyToken(token);
  if (!payload) throw new APIError(401, "Unauthorized - Invalid token");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", payload.userId)
    .single();

  roles = roles ?? Object.values(ROLES);

  if (!user || !roles.includes(user.role as role))
    throw new APIError(403, "Forbidden - Role required");

  return user as User;
}
