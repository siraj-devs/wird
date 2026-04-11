import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const token = request.cookies.get("auth_token")?.value;
    if (!token) throw new APIError(401, "Unauthorized");

    const payload = verifyToken(token);
    if (!payload) throw new APIError(401, "Unauthorized");

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", payload.userId)
      .single();

    if (!user || ![ROLES.OWNER].includes(user.role as Role))
      throw new APIError(403, "Forbidden");

    const body = await request.json();
    const { role } = body as { role: Role };

    if (!role || !Object.values(ROLES).includes(role))
      throw new APIError(
        400,
        `Invalid role. Must be one of: ${Object.values(ROLES).join(", ")}`,
      );

    if (id === payload.userId)
      throw new APIError(400, "Cannot change your own role");

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update({ role })
      .eq("id", id)
      .select("id, username, email, role, avatar_url")
      .single();

    if (error) throw new APIError(500, "Database error: " + error.message);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
