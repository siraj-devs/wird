import { APIError } from "@/lib/api";
import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ROLES: Role[] = [ROLES.ADMIN, ROLES.OWNER] as const;
const ALLOWED_STATUSES = ["present", "absent", "appeal"] as const;

const isDateKey = (value?: string): value is string => {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const requireAuthorizedUser = async (request: NextRequest) => {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) throw new APIError(401, "Unauthorized - No token provided");

  const payload = verifyToken(token);
  if (!payload) throw new APIError(401, "Unauthorized - Invalid token");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", payload.userId)
    .single();

  if (!user || !ALLOWED_ROLES.includes((user.role as Role))) {
    throw new APIError(403, "Forbidden - Admin or owner role required");
  }

  return user;
};

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedUser(request);

    const meetingDate = request.nextUrl.searchParams.get("meeting_date") ?? undefined;
    if (!isDateKey(meetingDate)) {
      throw new APIError(400, "meeting_date must be YYYY-MM-DD");
    }

    const { data, error } = await supabaseAdmin
      .from("meeting_attendance")
      .select("*")
      .eq("meeting_date", meetingDate);

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ records: data ?? [] });
  } catch (error: unknown) {
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuthorizedUser(request);

    const body = await request.json();
    const meetingDate = body?.meeting_date as string | undefined;
    const attendees = Array.isArray(body?.attendees) ? body.attendees : null;

    if (!isDateKey(meetingDate)) {
      throw new APIError(400, "meeting_date must be YYYY-MM-DD");
    }

    if (!attendees) {
      throw new APIError(400, "attendees must be an array");
    }

    const dedupeKeys = new Set<string>();
    const payloadToInsert: Array<{
      meeting_date: string;
      user_id: string | null;
      guest_name: string | null;
      status: (typeof ALLOWED_STATUSES)[number];
    }> = [];

    for (const attendee of attendees) {
      const status = attendee?.status as string | undefined;
      const userId =
        typeof attendee?.user_id === "string" && attendee.user_id.length > 0
          ? attendee.user_id
          : null;
      const guestName =
        typeof attendee?.guest_name === "string" && attendee.guest_name.trim().length > 0
          ? attendee.guest_name.trim()
          : null;

      if (!status || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
        throw new APIError(400, "invalid attendee status");
      }

      if (!userId && !guestName) {
        continue;
      }

      const dedupeKey = userId ? `user:${userId}` : `guest:${guestName!.toLowerCase()}`;
      if (dedupeKeys.has(dedupeKey)) {
        continue;
      }
      dedupeKeys.add(dedupeKey);

      payloadToInsert.push({
        meeting_date: meetingDate,
        user_id: userId,
        guest_name: guestName,
        status: status as (typeof ALLOWED_STATUSES)[number],
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("meeting_attendance")
      .delete()
      .eq("meeting_date", meetingDate);

    if (deleteError) throw new APIError(500, deleteError.message);

    if (payloadToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("meeting_attendance")
        .insert(payloadToInsert);

      if (insertError) throw new APIError(500, insertError.message);
    }

    return NextResponse.json({ ok: true, count: payloadToInsert.length });
  } catch (error: unknown) {
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
