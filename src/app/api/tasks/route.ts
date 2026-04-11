import { APIError, checkAuth } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await checkAuth(request, "owner");

    const body = await request.json();
    const { name, category_id, days } = body;

    if (!name) throw new APIError(400, "Task name is required");

    const { data: task, error: taskError } = await supabaseAdmin
      .from("tasks")
      .insert({
        name,
        category_id: category_id ?? null,
        days: days ?? [1, 2, 3, 4, 5, 6, 7],
      })
      .select()
      .single();

    if (taskError) throw new APIError(500, taskError.message);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
