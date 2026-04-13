import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

const APP_TIMEZONE = "Africa/Casablanca";

const getDateKeyInTimezone = (date: Date, timeZone = APP_TIMEZONE): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const isDateKey = (value?: string): value is string => {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
};

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

  const payloadBody = await request.json();

  const isLegacyBody = Array.isArray(payloadBody);
  const userTasks = isLegacyBody ? payloadBody : payloadBody.tasks;
  const targetDate = isLegacyBody ? undefined : payloadBody.target_date;

  if (!Array.isArray(userTasks))
    throw new APIError(400, "body must be an array");

  if (targetDate !== undefined && !isDateKey(targetDate)) {
    throw new APIError(400, "target_date must be YYYY-MM-DD");
  }

  try {
    const now = new Date();
    const todayKey = getDateKeyInTimezone(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKeyInTimezone(yesterday);

    const selectedDateKey = targetDate ?? todayKey;

    if (![todayKey, yesterdayKey].includes(selectedDateKey)) {
      throw new APIError(
        403,
        "Forbidden - Tasks can only be saved for today or yesterday",
      );
    }

    const dayStart = new Date(`${selectedDateKey}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const { error: deleteError } = await supabaseAdmin
      .from("user_tasks")
      .delete()
      .eq("user_id", payload.userId)
      .gte("completed_at", dayStart.toISOString())
      .lt("completed_at", dayEnd.toISOString());

    if (deleteError) throw new APIError(500, "Failed to delete existing tasks");

    if (userTasks.length > 0) {
      const completionTimestamp =
        selectedDateKey === todayKey
          ? new Date().toISOString()
          : new Date(`${selectedDateKey}T12:00:00.000Z`).toISOString();

      const { error: insertError } = await supabaseAdmin
        .from("user_tasks")
        .insert(
          userTasks.map((task) => ({
            user_id: payload.userId,
            week_task_id: task.week_task_id,
            completed_at: completionTimestamp,
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
