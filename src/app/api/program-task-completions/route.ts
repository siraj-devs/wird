import { verifyToken } from "@/lib/auth";
import { getAuthUserRole } from "@/lib/auth-db";
import { APIError } from "@/lib/api";
import { saveProgramTaskCompletions } from "@/lib/programs";
import { ROLES } from "@/lib/roles";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) throw new APIError(401, "Unauthorized");

    const payload = verifyToken(token);
    if (!payload?.userId) throw new APIError(401, "Unauthorized");

    const role = await getAuthUserRole(payload);
    if (
      !role ||
      ![ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER].includes(role)
    ) {
      throw new APIError(403, "Forbidden");
    }

    const body = await request.json();
    const targetDate = body.target_date as string | undefined;
    const tasks = body.tasks as Array<{ program_task_id?: string; week_task_id?: string }> | undefined;

    if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      throw new APIError(400, "target_date must be YYYY-MM-DD");
    }

    if (!Array.isArray(tasks)) {
      throw new APIError(400, "tasks array is required");
    }

    const programTaskIds = tasks
      .map((t) => t.program_task_id ?? t.week_task_id)
      .filter((id): id is string => !!id);

    await saveProgramTaskCompletions({
      userId: payload.userId,
      dateKey: targetDate,
      programTaskIds,
    });

    return NextResponse.json({
      message: "Tasks saved successfully",
      count: programTaskIds.length,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
