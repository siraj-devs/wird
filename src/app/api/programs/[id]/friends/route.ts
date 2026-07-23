import { APIError, checkAuth } from "@/lib/api";
import {
  isProgramMember,
  orderedFriendPair,
} from "@/lib/programs";
import { ROLES } from "@/lib/roles";
import { supabaseNew } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function assertBothMembers(
  programId: string,
  userId: string,
  friendId: string,
) {
  const [a, b] = await Promise.all([
    isProgramMember(programId, userId),
    isProgramMember(programId, friendId),
  ]);
  if (!a || !b) {
    throw new APIError(400, "Both users must be members of this program");
  }
}

/** Send a friend request (member) or create accepted friendship (admin/owner). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await checkAuth(
      request,
      ROLES.OWNER,
      ROLES.ADMIN,
      ROLES.MEMBER,
    );
    const { id: programId } = await params;
    const body = await request.json();

    const isAdmin = [ROLES.OWNER, ROLES.ADMIN].includes(user.role);
    const friendId = (body.friend_id as string | undefined) ?? undefined;
    const otherUserId =
      friendId ?? (body.user_id as string | undefined) ?? undefined;

    // Admin can still link two arbitrary members as accepted friends
    if (isAdmin && body.user_id && body.friend_id) {
      const userId = body.user_id as string;
      const targetId = body.friend_id as string;
      if (userId === targetId)
        throw new APIError(400, "Cannot friend yourself");

      await assertBothMembers(programId, userId, targetId);
      const pair = orderedFriendPair(userId, targetId);

      const { data, error } = await supabaseNew
        .from("program_friends")
        .upsert(
          {
            program_id: programId,
            ...pair,
            requester_id: userId,
            status: "accepted",
            responded_at: new Date().toISOString(),
          },
          { onConflict: "program_id,user_a_id,user_b_id" },
        )
        .select()
        .single();

      if (error) throw new APIError(500, error.message);
      return NextResponse.json({ friend: data }, { status: 201 });
    }

    if (!otherUserId) throw new APIError(400, "friend_id is required");
    if (otherUserId === user.id)
      throw new APIError(400, "Cannot friend yourself");

    const meInProgram = await isProgramMember(programId, user.id);
    if (!meInProgram)
      throw new APIError(403, "You are not a member of this program");

    await assertBothMembers(programId, user.id, otherUserId);
    const pair = orderedFriendPair(user.id, otherUserId);

    const { data: existing } = await supabaseNew
      .from("program_friends")
      .select("*")
      .eq("program_id", programId)
      .eq("user_a_id", pair.user_a_id)
      .eq("user_b_id", pair.user_b_id)
      .maybeSingle();

    if (existing) {
      const row = existing as ProgramFriend;
      if (row.status === "accepted") {
        throw new APIError(400, "Already friends");
      }
      // Other person already requested me → accept
      if (row.requester_id !== user.id) {
        const { data, error } = await supabaseNew
          .from("program_friends")
          .update({
            status: "accepted",
            responded_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .select()
          .single();
        if (error) throw new APIError(500, error.message);
        return NextResponse.json({ friend: data, auto_accepted: true });
      }
      throw new APIError(400, "Friend request already sent");
    }

    const { data, error } = await supabaseNew
      .from("program_friends")
      .insert({
        program_id: programId,
        ...pair,
        requester_id: user.id,
        status: "pending",
      })
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

/** Accept or reject a pending friend request. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await checkAuth(
      request,
      ROLES.OWNER,
      ROLES.ADMIN,
      ROLES.MEMBER,
    );
    const { id: programId } = await params;
    const body = await request.json();
    const friendshipId = body.friendship_id as string | undefined;
    const action = body.action as "accept" | "reject" | undefined;

    if (!friendshipId) throw new APIError(400, "friendship_id is required");
    if (!action || !["accept", "reject"].includes(action)) {
      throw new APIError(400, "action must be accept or reject");
    }

    const { data: existing, error: fetchError } = await supabaseNew
      .from("program_friends")
      .select("*")
      .eq("id", friendshipId)
      .eq("program_id", programId)
      .maybeSingle();

    if (fetchError) throw new APIError(500, fetchError.message);
    if (!existing) throw new APIError(404, "Request not found");

    const row = existing as ProgramFriend;
    if (row.status !== "pending") {
      throw new APIError(400, "Request is not pending");
    }

    const isParticipant =
      row.user_a_id === user.id || row.user_b_id === user.id;
    if (!isParticipant) throw new APIError(403, "Forbidden");

    // Only the receiver (not requester) can accept/reject
    if (row.requester_id === user.id) {
      throw new APIError(403, "Cannot respond to your own request");
    }

    if (action === "reject") {
      const { error } = await supabaseNew
        .from("program_friends")
        .delete()
        .eq("id", friendshipId)
        .eq("program_id", programId);
      if (error) throw new APIError(500, error.message);
      return NextResponse.json({ ok: true, rejected: true });
    }

    const { data, error } = await supabaseNew
      .from("program_friends")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", friendshipId)
      .select()
      .single();

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ friend: data });
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

/** Cancel a pending request, unfriend, or admin remove. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await checkAuth(
      request,
      ROLES.OWNER,
      ROLES.ADMIN,
      ROLES.MEMBER,
    );
    const { id: programId } = await params;
    const friendshipId = request.nextUrl.searchParams.get("friendship_id");
    const userId = request.nextUrl.searchParams.get("user_id");
    const friendId = request.nextUrl.searchParams.get("friend_id");
    const isAdmin = [ROLES.OWNER, ROLES.ADMIN].includes(user.role);

    if (friendshipId) {
      const { data: existing } = await supabaseNew
        .from("program_friends")
        .select("*")
        .eq("id", friendshipId)
        .eq("program_id", programId)
        .maybeSingle();

      if (!existing) throw new APIError(404, "Friendship not found");
      const row = existing as ProgramFriend;
      const isParticipant =
        row.user_a_id === user.id || row.user_b_id === user.id;

      if (!isAdmin && !isParticipant) throw new APIError(403, "Forbidden");

      const { error } = await supabaseNew
        .from("program_friends")
        .delete()
        .eq("id", friendshipId)
        .eq("program_id", programId);
      if (error) throw new APIError(500, error.message);
      return NextResponse.json({ ok: true });
    }

    if (!userId || !friendId) {
      throw new APIError(400, "friendship_id or user_id+friend_id required");
    }

    if (!isAdmin && userId !== user.id && friendId !== user.id) {
      throw new APIError(403, "Forbidden");
    }

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
