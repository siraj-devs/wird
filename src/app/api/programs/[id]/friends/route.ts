import { APIError, checkAuth } from "@/lib/api";
import { orderedFriendPair } from "@/lib/programs";
import { ROLES } from "@/lib/roles";
import { supabaseNew } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await params;
    const body = await request.json();
    const userId = body.user_id as string | undefined;
    const friendId = body.friend_id as string | undefined;

    if (!userId || !friendId)
      throw new APIError(400, "user_id and friend_id are required");
    if (userId === friendId)
      throw new APIError(400, "Cannot friend yourself");

    const pair = orderedFriendPair(userId, friendId);

    const { data, error } = await supabaseNew
      .from("program_friends")
      .upsert(
        { program_id: programId, ...pair },
        { onConflict: "program_id,user_a_id,user_b_id" },
      )
      .select()
      .single();

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ friend: data }, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await params;
    const friendshipId = request.nextUrl.searchParams.get("friendship_id");
    const userId = request.nextUrl.searchParams.get("user_id");
    const friendId = request.nextUrl.searchParams.get("friend_id");

    if (friendshipId) {
      const { error } = await supabaseNew
        .from("program_friends")
        .delete()
        .eq("id", friendshipId)
        .eq("program_id", programId);
      if (error) throw new APIError(500, error.message);
      return NextResponse.json({ ok: true });
    }

    if (!userId || !friendId)
      throw new APIError(400, "friendship_id or user_id+friend_id required");

    const pair = orderedFriendPair(userId, friendId);
    const { error } = await supabaseNew
      .from("program_friends")
      .delete()
      .eq("program_id", programId)
      .eq("user_a_id", pair.user_a_id)
      .eq("user_b_id", pair.user_b_id);

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
