import { supabaseAuth } from "@/lib/supabase";

export type ConnectionType = "discord" | "telegram";

export interface ConnectionInput {
  id: string;
  type: ConnectionType;
  name: string;
  username: string;
  avatar?: string | null;
  email?: string | null;
}

type AuthUserRow = {
  id: string;
  name: nullable<string>;
  phone: nullable<string>;
  email: nullable<string>;
  role: Role;
  created_at: string;
  updated_at: string;
  connections?: Connection[] | Connection | null;
};

function normalizeConnections(
  connections: Connection[] | Connection | null | undefined,
): Connection[] {
  if (!connections) return [];
  if (Array.isArray(connections)) return connections;
  return [connections];
}

/** Map auth DB user (+ connections) to the app User shape used in UI. */
export function mapAuthUser(row: AuthUserRow): User {
  const connections = normalizeConnections(row.connections).sort(
    (a, b) =>
      new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime(),
  );
  const primary = connections[0] ?? null;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    connections,
    // Display / compatibility fields from primary connection
    username: primary?.username ?? "user",
    avatar_url: primary?.avatar ?? null,
    full_name: row.name,
    phone_number: row.phone,
    friend_id: null,
    provider_id: primary?.id ?? "",
  };
}

/**
 * Find or create a user from an OAuth connection.
 * - Existing connection → update accessed_at / profile fields, return user_id
 * - New connection → create user + connection
 */
export async function upsertConnectionUser(
  input: ConnectionInput,
): Promise<string> {
  const now = new Date().toISOString();

  const { data: existingConnection } = await supabaseAuth
    .from("connections")
    .select("id, user_id")
    .eq("id", input.id)
    .maybeSingle();

  if (existingConnection) {
    await supabaseAuth
      .from("connections")
      .update({
        name: input.name,
        username: input.username,
        avatar: input.avatar ?? null,
        accessed_at: now,
      })
      .eq("id", input.id);

    if (input.email) {
      await supabaseAuth
        .from("users")
        .update({ email: input.email, updated_at: now })
        .eq("id", existingConnection.user_id)
        .is("email", null);
    }

    return existingConnection.user_id as string;
  }

  const { data: newUser, error: userError } = await supabaseAuth
    .from("users")
    .insert({
      email: input.email ?? null,
      role: "newcomer",
    })
    .select("id")
    .single();

  if (userError || !newUser) {
    console.error("Error creating auth user:", userError);
    throw new Error("Failed to create user");
  }

  const { error: connectionError } = await supabaseAuth
    .from("connections")
    .insert({
      id: input.id,
      user_id: newUser.id,
      name: input.name,
      username: input.username,
      avatar: input.avatar ?? null,
      type: input.type,
      authorized_at: now,
      accessed_at: now,
    });

  if (connectionError) {
    console.error("Error creating connection:", connectionError);
    await supabaseAuth.from("users").delete().eq("id", newUser.id);
    throw new Error("Failed to create connection");
  }

  return newUser.id as string;
}

export async function createAuthSession(userId: string, token: string) {
  const { error } = await supabaseAuth.from("sessions").insert({
    user_id: userId,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (error) {
    console.error("Error creating session:", error);
    throw new Error("Failed to create session");
  }
}

/** Resolve role from auth DB by user id (JWT path). */
export async function getAuthUserRole(
  userId: string,
): Promise<Role | null> {
  const { data } = await supabaseAuth
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as Role | undefined) ?? null;
}

/** Resolve user from auth session token. */
export async function getAuthUserFromSession(
  token: string,
): Promise<{ id: string; role: Role } | null> {
  const { data: session } = await supabaseAuth
    .from("sessions")
    .select("user_id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!session) return null;

  const { data: user } = await supabaseAuth
    .from("users")
    .select("id, role")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user) return null;
  return { id: user.id as string, role: user.role as Role };
}
