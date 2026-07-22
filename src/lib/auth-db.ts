import { ROLES } from "@/lib/roles";
import { supabaseAuth } from "@/lib/supabase";

export type ConnectionType = "discord" | "telegram";

export interface ConnectionInput {
  id: string;
  type: ConnectionType;
  name: string;
  username: string;
  avatar?: string | null;
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
    username: primary?.username ?? "user",
    avatar_url: primary?.avatar ?? null,
    full_name: row.name,
    phone_number: row.phone,
    friend_id: null,
    provider_id: primary?.id ?? "",
  };
}

/** Pending login: connection exists, user row not created yet. */
export function mapPendingConnection(connection: Connection): User {
  return {
    id: "",
    name: null,
    phone: null,
    email: null,
    role: ROLES.NEWCOMER,
    created_at: connection.authorized_at,
    updated_at: connection.accessed_at,
    connections: [connection],
    username: connection.username,
    avatar_url: connection.avatar,
    full_name: null,
    phone_number: null,
    friend_id: null,
    provider_id: connection.id,
  };
}

/**
 * Upsert OAuth connection only — does NOT create a users row.
 * Provider email is never stored here.
 */
export async function upsertConnection(
  input: ConnectionInput,
): Promise<{ connectionId: string; userId: string | null }> {
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAuth
    .from("connections")
    .select("id, user_id")
    .eq("id", input.id)
    .maybeSingle();

  if (existing) {
    await supabaseAuth
      .from("connections")
      .update({
        name: input.name,
        username: input.username,
        avatar: input.avatar ?? null,
        accessed_at: now,
      })
      .eq("id", input.id);

    return {
      connectionId: existing.id as string,
      userId: (existing.user_id as string | null) ?? null,
    };
  }

  const { error } = await supabaseAuth.from("connections").insert({
    id: input.id,
    user_id: null,
    name: input.name,
    username: input.username,
    avatar: input.avatar ?? null,
    type: input.type,
    authorized_at: now,
    accessed_at: now,
  });

  if (error) {
    console.error("Error creating connection:", error);
    throw new Error("Failed to create connection");
  }

  return { connectionId: input.id, userId: null };
}

export async function createAuthSession(params: {
  connectionId: string;
  userId?: string | null;
  token: string;
}) {
  const { error } = await supabaseAuth.from("sessions").insert({
    connection_id: params.connectionId,
    user_id: params.userId ?? null,
    token: params.token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (error) {
    console.error("Error creating session:", error);
    throw new Error("Failed to create session");
  }
}

/** Resolve role from JWT payload (pending connections → newcomer). */
export async function getAuthUserRole(
  payload: JWTPayload,
): Promise<Role | null> {
  if (!payload.connectionId) return null;

  if (!payload.userId) {
    const { data } = await supabaseAuth
      .from("connections")
      .select("id, user_id")
      .eq("id", payload.connectionId)
      .maybeSingle();

    if (!data) return null;
    if (data.user_id) {
      const { data: user } = await supabaseAuth
        .from("users")
        .select("role")
        .eq("id", data.user_id)
        .maybeSingle();
      return (user?.role as Role | undefined) ?? null;
    }
    return ROLES.NEWCOMER;
  }

  const { data } = await supabaseAuth
    .from("users")
    .select("role")
    .eq("id", payload.userId)
    .maybeSingle();
  return (data?.role as Role | undefined) ?? null;
}

/** Resolve user from auth session token. */
export async function getAuthUserFromSession(
  token: string,
): Promise<{ id: string; role: Role } | null> {
  const { data: session } = await supabaseAuth
    .from("sessions")
    .select("user_id, connection_id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!session) return null;

  if (!session.user_id) {
    return { id: "", role: ROLES.NEWCOMER };
  }

  const { data: user } = await supabaseAuth
    .from("users")
    .select("id, role")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user) return null;
  return { id: user.id as string, role: user.role as Role };
}

/**
 * Create the users row from onboarding and link the connection.
 * Email comes only from the form — never from the OAuth provider.
 */
export async function completeOnboarding(params: {
  connectionId: string;
  name: string;
  phone: string;
  email: string;
}): Promise<User> {
  const now = new Date().toISOString();

  const { data: connection, error: connectionLookupError } = await supabaseAuth
    .from("connections")
    .select("*")
    .eq("id", params.connectionId)
    .maybeSingle();

  if (connectionLookupError || !connection) {
    throw new Error("Connection not found");
  }

  if (connection.user_id) {
    throw new Error("User already registered");
  }

  const { data: newUser, error: userError } = await supabaseAuth
    .from("users")
    .insert({
      name: params.name,
      phone: params.phone,
      email: params.email,
      role: "guest",
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (userError || !newUser) {
    console.error("Error creating user:", userError);
    throw new Error("Failed to create user");
  }

  const { error: linkError } = await supabaseAuth
    .from("connections")
    .update({ user_id: newUser.id })
    .eq("id", params.connectionId);

  if (linkError) {
    console.error("Error linking connection:", linkError);
    await supabaseAuth.from("users").delete().eq("id", newUser.id);
    throw new Error("Failed to link connection");
  }

  return mapAuthUser({
    ...newUser,
    connections: [{ ...connection, user_id: newUser.id } as Connection],
  });
}
