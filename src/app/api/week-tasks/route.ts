import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

// GET week tasks for a specific week
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

  if (
    !user ||
    ![ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER].includes(user.role as Role)
  )
    throw new APIError(403, "Forbidden - Member role required");

  const searchParams = request.nextUrl.searchParams;
  const weekId = searchParams.get("week_id");

  if (!weekId) {
    throw new APIError(400, "week_id query parameter is required");
  }

  try {
    const { data: weekTasks, error } = await supabaseAdmin
      .from("week_tasks")
      .select("*")
      .eq("week_id", weekId)
      .order("sort_order", { ascending: true });

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ weekTasks });
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

// POST add a task to a week
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

  if (!user || ![ROLES.ADMIN, ROLES.OWNER].includes(user.role as Role))
    throw new APIError(403, "Forbidden - Admin role required");

  const body = await request.json();
  const {
    week_id,
    task_id,
    task_name,
    category_id,
    category_name,
    task_days,
    sort_order,
  } = body;

  if (!week_id || !task_name) {
    throw new APIError(400, "week_id and task_name are required");
  }

  try {
    const { data: weekTask, error } = await supabaseAdmin
      .from("week_tasks")
      .insert({
        week_id,
        task_id: task_id || null,
        task_name,
        category_id: category_id || null,
        category_name: category_name || null,
        task_days: task_days || [1, 2, 3, 4, 5, 6, 7],
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ weekTask }, { status: 201 });
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

// DELETE remove a task from a week
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

  if (!user || ![ROLES.ADMIN, ROLES.OWNER].includes(user.role as Role))
    throw new APIError(403, "Forbidden - Admin role required");

  const searchParams = request.nextUrl.searchParams;
  const weekTaskId = searchParams.get("id");

  if (!weekTaskId) {
    throw new APIError(400, "id query parameter is required");
  }

  try {
    const { error } = await supabaseAdmin
      .from("week_tasks")
      .delete()
      .eq("id", weekTaskId);

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ message: "Week task deleted successfully" });
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
