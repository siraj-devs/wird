import { verifyToken } from "@/lib/auth";
import { getAuthUserRole } from "@/lib/auth-db";
import { ROLES } from "@/lib/roles";
import { supabaseAuth } from "@/lib/supabase";
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

    const role = await getAuthUserRole(payload);
    if (!role || role !== ROLES.OWNER) throw new APIError(403, "Forbidden");

    const body = await request.json();
    const { role: nextRole } = body as { role: Role };

    if (!nextRole || !Object.values(ROLES).includes(nextRole))
      throw new APIError(
        400,
        `Invalid role. Must be one of: ${Object.values(ROLES).join(", ")}`,
      );

    if (id === payload.userId)
      throw new APIError(400, "Cannot change your own role");

    const { data: updatedUser, error } = await supabaseAuth
      .from("users")
      .update({ role: nextRole, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name, email, phone, role")
      .single();

    if (error) throw new APIError(500, "Database error: " + error.message);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
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
