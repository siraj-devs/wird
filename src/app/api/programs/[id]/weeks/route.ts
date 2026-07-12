import { checkAuth } from "@/lib/api";
import { APIError } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSaturdayStart = (date: Date): Date => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diffToSaturday = (day + 1) % 7;
  value.setDate(value.getDate() - diffToSaturday);
  return value;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await context.params;

    const body = await request.json();
    const { start_date, week_id } = body;

    let resolvedWeekId = week_id as string | undefined;

    if (!resolvedWeekId) {
      if (!start_date) {
        throw new APIError(400, "start_date or week_id is required");
      }

      const parsedDate = new Date(start_date);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new APIError(400, "Invalid start_date");
      }

      const startDate = getSaturdayStart(parsedDate);
      const startDateStr = formatDateOnly(startDate);

      const { data: existingWeek } = await supabaseAdmin
        .from("weeks")
        .select("id")
        .eq("start_date", startDateStr)
        .maybeSingle();

      if (existingWeek) {
        resolvedWeekId = existingWeek.id;
      } else {
        const { data: newWeek, error: weekError } = await supabaseAdmin
          .from("weeks")
          .insert({ start_date: startDateStr })
          .select("id")
          .single();

        if (weekError) throw new APIError(500, weekError.message);
        resolvedWeekId = newWeek.id;
      }
    }

    const { data: existingProgramWeeks, error: existingWeeksError } =
      await supabaseAdmin
        .from("program_weeks")
        .select("week_number")
        .eq("program_id", programId);

    if (existingWeeksError) {
      throw new APIError(500, existingWeeksError.message);
    }

    const nextWeekNumber =
      (existingProgramWeeks ?? []).reduce(
        (max, row) => Math.max(max, row.week_number),
        0,
      ) + 1;

    const { data: programWeek, error } = await supabaseAdmin
      .from("program_weeks")
      .insert({
        program_id: programId,
        week_id: resolvedWeekId,
        week_number: nextWeekNumber,
      })
      .select("*, week:weeks(*)")
      .single();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ programWeek }, { status: 201 });
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await context.params;

    const searchParams = request.nextUrl.searchParams;
    const programWeekId = searchParams.get("id");

    if (!programWeekId) {
      throw new APIError(400, "id query parameter is required");
    }

    const { error } = await supabaseAdmin
      .from("program_weeks")
      .delete()
      .eq("id", programWeekId)
      .eq("program_id", programId);

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ message: "Program week removed successfully" });
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
