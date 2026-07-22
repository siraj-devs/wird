import { NextRequest } from "next/server";
import { getUser } from "@/actions";
import { getAuthUserRole, mapPendingConnection } from "./auth-db";
import { verifyToken } from "./auth";
import { ROLES } from "./roles";
import { supabaseAuth } from "./supabase";

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
  if (!payload?.connectionId)
    throw new APIError(401, "Unauthorized - Invalid token");

  let user: User | null = null;

  if (payload.userId) {
    user = await getUser(payload.userId);
  } else {
    const { data: connection } = await supabaseAuth
      .from("connections")
      .select("*")
      .eq("id", payload.connectionId)
      .maybeSingle();

    if (connection?.user_id) {
      user = await getUser(connection.user_id as string);
    } else if (connection) {
      user = mapPendingConnection(connection as Connection);
    }
  }

  const allowedRoles = roles.length > 0 ? roles : Object.values(ROLES);

  if (!user || !allowedRoles.includes(user.role as role))
    throw new APIError(403, "Forbidden - Role required");

  return user;
}
