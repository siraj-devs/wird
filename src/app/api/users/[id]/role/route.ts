import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function verifySession(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }

  // Verify user session
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("user_id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (!session) {
    return { error: "Invalid session", status: 401 };
  }

  // Get user role
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", session.user_id)
    .single();

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  return { session, user };
}

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
  const { role } = body;

  const validRoles = ["guest", "member", "admin", "owner"];
  if (!role || !validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be one of: guest, member, admin, owner" },
      { status: 400 },
    );
  }

  // Only owners can create other owners
  if (role === "owner" && user.role !== "owner") {
    return NextResponse.json(
      { error: "Forbidden - Only owners can assign owner role" },
      { status: 403 },
    );
  }

  // Prevent users from changing their own role
  if (id === session.user_id) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 },
    );
  }

  const { data: updatedUser, error } = await supabaseAdmin
    .from("users")
    .update({ role })
    .eq("id", id)
    .select("id, username, email, role, avatar_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: updatedUser });
}
