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

  if (!user || !["admin", "owner"].includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden - Admin role required" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { name, category_id, is_active, frequency, weekly_days, start_date, end_date } = body;

  const updateData: {
    name?: string;
    category_id?: string;
    is_active?: boolean;
    frequency?: string;
    weekly_days?: number[] | null;
    start_date?: string;
    end_date?: string;
  } = {};
  if (name !== undefined) updateData.name = name;
  if (category_id !== undefined) updateData.category_id = category_id;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (frequency !== undefined) updateData.frequency = frequency;
  if (weekly_days !== undefined) updateData.weekly_days = weekly_days;
  if (start_date !== undefined) updateData.start_date = start_date;
  if (end_date !== undefined) updateData.end_date = end_date;

  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task });
}

export async function DELETE(
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

  if (!user || !["admin", "owner"].includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden - Admin role required" },
      { status: 403 },
    );
  }

  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Task deleted successfully" });
}
