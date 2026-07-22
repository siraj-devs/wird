import { APIError, checkAuth } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseNew } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

function parseSchedule(body: {
  schedule_type?: string;
  days?: unknown;
  start_date?: string;
  end_date?: string;
}) {
  const schedule_type = body.schedule_type as "recurring" | "dated" | undefined;
  if (!schedule_type || !["recurring", "dated"].includes(schedule_type)) {
    throw new APIError(400, "schedule_type must be recurring or dated");
  }

  let days: number[] | null = null;
  let start_date: string | null = null;
  let end_date: string | null = null;

  if (schedule_type === "recurring") {
    days = Array.isArray(body.days)
      ? body.days.map(Number).filter((d: number) => d >= 1 && d <= 7)
      : [];
    if (days.length === 0)
      throw new APIError(400, "Select at least one day for recurring tasks");
    start_date = null;
    end_date = null;
  } else {
    days = null;
    start_date = body.start_date || null;
    end_date = body.end_date || null;
    if (!start_date || !end_date)
      throw new APIError(400, "start_date and end_date are required");
    if (end_date < start_date)
      throw new APIError(400, "end_date must be on or after start_date");
  }

  return { schedule_type, days, start_date, end_date };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await params;
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category_id = body.category_id as string | undefined;

    if (!name) throw new APIError(400, "Task name is required");

    const schedule = parseSchedule(body);
    const resolvedCategoryId =
      typeof category_id === "string" && category_id.length > 0
        ? category_id
        : null;

    const { data: existing } = await supabaseNew
      .from("program_tasks")
      .select("sort_order")
      .eq("program_id", programId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const sort_order = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabaseNew
      .from("program_tasks")
      .insert({
        program_id: programId,
        category_id: resolvedCategoryId,
        name,
        ...schedule,
        sort_order,
      })
      .select()
      .single();

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await params;
    const body = await request.json();

    const taskId = body.task_id as string | undefined;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category_id = body.category_id as string | null | undefined;

    if (!taskId) throw new APIError(400, "task_id is required");
    if (!name) throw new APIError(400, "Task name is required");

    const schedule = parseSchedule(body);
    const resolvedCategoryId =
      typeof category_id === "string" && category_id.length > 0
        ? category_id
        : null;

    const { data, error } = await supabaseNew
      .from("program_tasks")
      .update({
        name,
        category_id: resolvedCategoryId,
        ...schedule,
      })
      .eq("id", taskId)
      .eq("program_id", programId)
      .select()
      .single();

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ task: data });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await params;
    const taskId = request.nextUrl.searchParams.get("task_id");
    if (!taskId) throw new APIError(400, "task_id is required");

    const { error } = await supabaseNew
      .from("program_tasks")
      .delete()
      .eq("id", taskId)
      .eq("program_id", programId);

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
