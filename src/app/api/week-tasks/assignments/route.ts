import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

// POST assign a week task to users
export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) throw new APIError(401, "Unauthorized - No token provided");

  const payload = verifyToken(token);
  if (!payload) throw new APIError(401, "Unauthorized - Invalid token");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", payload.userId)
    .single();

  if (!user || ![ROLES.OWNER].includes(user.role as Role))
    throw new APIError(403, "Forbidden - Owner role required");

  const body = await request.json();
  const { week_task_id, user_ids } = body;

  if (!week_task_id || !Array.isArray(user_ids) || user_ids.length === 0) {
    throw new APIError(400, "week_task_id and user_ids array are required");
  }

  try {
    // Delete existing assignments for this week task
    await supabaseAdmin
      .from("week_task_assignments")
      .delete()
      .eq("week_task_id", week_task_id);

    // Create new assignments
    const assignments = user_ids.map(user_id => ({
      week_task_id,
      user_id
    }));

    const { data, error } = await supabaseAdmin
      .from("week_task_assignments")
      .insert(assignments)
      .select();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ assignments: data }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET assignments for a week task
export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) throw new APIError(401, "Unauthorized - No token provided");

  const payload = verifyToken(token);
  if (!payload) throw new APIError(401, "Unauthorized - Invalid token");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", payload.userId)
    .single();

  if (!user || ![ROLES.OWNER, ROLES.ADMIN].includes(user.role as Role))
    throw new APIError(403, "Forbidden - Owner/Admin role required");

  const searchParams = request.nextUrl.searchParams;
  const weekTaskId = searchParams.get("week_task_id");

  if (!weekTaskId) {
    throw new APIError(400, "week_task_id query parameter is required");
  }

  try {
    const { data: assignments, error } = await supabaseAdmin
      .from("week_task_assignments")
      .select("user_id")
      .eq("week_task_id", weekTaskId);

    if (error) throw new APIError(500, error.message);

    const userIds = (assignments || []).map(a => a.user_id);
    return NextResponse.json({ user_ids: userIds });
  } catch (error: unknown) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE remove all assignments for a week task
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) throw new APIError(401, "Unauthorized - No token provided");

  const payload = verifyToken(token);
  if (!payload) throw new APIError(401, "Unauthorized - Invalid token");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", payload.userId)
    .single();

  if (!user || ![ROLES.OWNER].includes(user.role as Role))
    throw new APIError(403, "Forbidden - Owner role required");

  const searchParams = request.nextUrl.searchParams;
  const weekTaskId = searchParams.get("week_task_id");

  if (!weekTaskId) {
    throw new APIError(400, "week_task_id query parameter is required");
  }

  try {
    const { error } = await supabaseAdmin
      .from("week_task_assignments")
      .delete()
      .eq("week_task_id", weekTaskId);

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ message: "Assignments deleted successfully" });
  } catch (error: unknown) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
