import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

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

  if (
    !user ||
    ![ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER].includes(user.role as Role)
  )
    throw new APIError(403, "Forbidden - Member role required");

  const body = await request.json();
  const { taskIds } = body;
  if (!Array.isArray(taskIds))
    throw new APIError(400, "taskIds must be an array");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { error: deleteError } = await supabaseAdmin
      .from("user_tasks")
      .delete()
      .eq("user_id", payload.userId)
      .gte("completed_at", today.toISOString())
      .lt("completed_at", tomorrow.toISOString());

    if (deleteError) throw new APIError(500, "Failed to delete existing tasks");

    if (taskIds.length > 0) {
      const userTasksToInsert = taskIds.map((taskId) => ({
        user_id: payload.userId,
        task_id: taskId,
        completed_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabaseAdmin
        .from("user_tasks")
        .insert(userTasksToInsert);

      if (insertError) throw new APIError(500, "Failed to insert new tasks");
    }

    return NextResponse.json({
      message: "Tasks saved successfully",
      count: taskIds.length,
    });
  } catch (error: unknown) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
