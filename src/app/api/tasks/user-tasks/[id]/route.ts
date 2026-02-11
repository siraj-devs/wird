import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user session
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("user_id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Get user role
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", session.user_id)
    .single();

  if (!user || !["member", "admin", "owner"].includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden - Member role required" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { is_done } = body;

  if (is_done === undefined) {
    return NextResponse.json(
      { error: "is_done field is required" },
      { status: 400 },
    );
  }

  const updateData = {
    is_done,
    completed_at: is_done ? new Date().toISOString() : null,
  };

  // Check if user is updating their own task or is an admin
  const { data: userTask } = await supabaseAdmin
    .from("user_tasks")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!userTask) {
    return NextResponse.json(
      { error: "Task assignment not found" },
      { status: 404 },
    );
  }

  if (
    userTask.user_id !== session.user_id &&
    !["admin", "owner"].includes(user.role)
  ) {
    return NextResponse.json(
      { error: "Forbidden - Can only update your own tasks" },
      { status: 403 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("user_tasks")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ userTask: data });
}
