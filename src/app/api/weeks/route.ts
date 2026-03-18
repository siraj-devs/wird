import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

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

// GET all weeks
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

  try {
    const { data: weeks, error } = await supabaseAdmin
      .from("weeks")
      .select("*")
      .order("start_date", { ascending: false })
      .limit(20);

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ weeks });
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

// POST create a new week
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
  const { start_date } = body;

  if (!start_date) {
    throw new APIError(400, "start_date is required");
  }

  try {
    const parsedDate = new Date(start_date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new APIError(400, "Invalid start_date");
    }

    const startDate = getSaturdayStart(parsedDate);

    const { data: week, error } = await supabaseAdmin
      .from("weeks")
      .insert({
        start_date: formatDateOnly(startDate),
      })
      .select()
      .single();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ week }, { status: 201 });
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
