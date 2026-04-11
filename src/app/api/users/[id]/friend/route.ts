import { verifyToken } from "@/lib/auth";
import { APIError } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function getOwner(request: NextRequest): Promise<JWTPayload> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) throw new APIError(401, "Unauthorized");

  const payload = verifyToken(token);
  if (!payload) throw new APIError(401, "Unauthorized");

  const { data: actor } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", payload.userId)
    .single();

  if (!actor || ![ROLES.OWNER].includes(actor.role as Role)) {
    throw new APIError(403, "Forbidden");
  }

  return payload;
}

async function getUserById(id: string): Promise<Pick<User, "id" | "friend_id"> | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, friend_id")
    .eq("id", id)
    .single();

  return (data as Pick<User, "id" | "friend_id"> | null) ?? null;
}

async function clearPair(userId: string) {
  const user = await getUserById(userId);
  if (!user) return;

  if (user.friend_id) {
    await supabaseAdmin.from("users").update({ friend_id: null }).eq("id", user.friend_id);
  }

  await supabaseAdmin.from("users").update({ friend_id: null }).eq("id", user.id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getOwner(request);
    const { id } = await params;

    const body = (await request.json()) as { friendId?: string | null };
    const friendId = body.friendId ?? null;

    const user = await getUserById(id);
    if (!user) throw new APIError(404, "User not found");

    if (!friendId) {
      await clearPair(id);
      return NextResponse.json({ message: "Friend removed" });
    }

    if (friendId === id) throw new APIError(400, "User cannot befriend themselves");

    const friend = await getUserById(friendId);
    if (!friend) throw new APIError(404, "Friend user not found");

    await clearPair(id);
    await clearPair(friendId);

    const [userUpdate, friendUpdate] = await Promise.all([
      supabaseAdmin.from("users").update({ friend_id: friendId }).eq("id", id),
      supabaseAdmin.from("users").update({ friend_id: id }).eq("id", friendId),
    ]);

    if (userUpdate.error || friendUpdate.error) {
      await Promise.all([
        supabaseAdmin.from("users").update({ friend_id: null }).eq("id", id),
        supabaseAdmin.from("users").update({ friend_id: null }).eq("id", friendId),
      ]);

      throw new APIError(500, "Failed to set friendship");
    }

    return NextResponse.json({ message: "Friend assigned successfully" });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
