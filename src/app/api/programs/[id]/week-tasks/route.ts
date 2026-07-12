import { checkAuth } from "@/lib/api";
import { APIError } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await context.params;

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

    const { data: programWeek, error: weekError } = await supabaseAdmin
      .from("program_weeks")
      .select("id")
      .eq("program_id", programId)
      .eq("week_id", week_id)
      .maybeSingle();

    if (weekError) throw new APIError(500, weekError.message);
    if (!programWeek) {
      throw new APIError(
        400,
        "This week is not part of the program. Add the week first.",
      );
    }

    const { data: weekTask, error } = await supabaseAdmin
      .from("week_tasks")
      .insert({
        week_id,
        program_id: programId,
        task_id: task_id || null,
        task_name,
        category_id: category_id || null,
        category_name: category_name || null,
        task_days: task_days || [1, 2, 3, 4, 5, 6, 7],
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ weekTask }, { status: 201 });
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
