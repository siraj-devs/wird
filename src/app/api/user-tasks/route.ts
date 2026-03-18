import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/api";
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

  const userTasks = await request.json();

  if (!Array.isArray(userTasks))
    throw new APIError(400, "body must be an array");

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

    if (userTasks.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("user_tasks")
        .insert(
          userTasks.map((task) => ({
            user_id: payload.userId,
            week_task_id: task.week_task_id,
            completed_at: new Date().toISOString(),
          })),
        );

      if (insertError) throw new APIError(500, "Failed to insert new tasks");
    }

    return NextResponse.json({
      message: "Tasks saved successfully",
      count: userTasks.length,
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
