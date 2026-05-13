import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) throw new APIError(401, "Unauthorized - No token provided");

  const payload = verifyToken(token);
  if (!payload) throw new APIError(401, "Unauthorized - Invalid token");

  try {
    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .select("id")
      .eq("user_id", payload.userId)
      .maybeSingle();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ submitted: Boolean(data) });
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

  if (!user || ![ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER].includes(user.role as Role))
    throw new APIError(403, "Forbidden - Member role required");

  const body = await request.json();
  const { answers } = body;

  if (!answers || typeof answers !== "object") {
    throw new APIError(400, "answers payload is required");
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .upsert(
        {
          user_id: payload.userId,
          answers,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ submission: data }, { status: 201 });
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
