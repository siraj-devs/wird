import { verifyToken } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { APIError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) throw new APIError(401, "Unauthorized");

    const payload = verifyToken(token);
    if (!payload) throw new APIError(401, "Unauthorized");

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", payload.userId)
      .single();



    if (!user || user.role !== ROLES.NEWCOMER)
      throw new APIError(403, "Forbidden");

    const body = await request.json();
    const { fullName, phoneNumber } = body;

    if (!fullName || !phoneNumber)
      throw new APIError(400, "Full name and phone number are required");

    const arabicRegex = /[\u0600-\u06FF]/;
    if (!arabicRegex.test(fullName) || fullName.trim().length === 0)
      throw new APIError(400, "Full name must be in Arabic");

    const cleanPhone = phoneNumber.replace(/\s/g, "");
    const phoneRegex = /^\+212[5-7]\d{8}$/;
    if (!phoneRegex.test(cleanPhone))
      throw new APIError(400, "Invalid Moroccan phone number");

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update({
        full_name: fullName.trim(),
        phone_number: cleanPhone,
        role: "guest",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.userId)
      .select()
      .single();

    if (error)
      throw new APIError(500, "Failed to update profile" + error.message);

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        phone_number: updatedUser.phone_number,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
