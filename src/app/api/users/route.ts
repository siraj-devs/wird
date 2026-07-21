import { verifyToken } from "@/lib/auth";
import { getAuthUserRole } from "@/lib/auth-db";
import { ROLES } from "@/lib/roles";
import { supabaseAuth } from "@/lib/supabase";
import { APIError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) throw new APIError(401, "Unauthorized");

    const payload = verifyToken(token);
    if (!payload) throw new APIError(401, "Unauthorized");

    const role = await getAuthUserRole(payload.userId);
    if (!role || role !== ROLES.NEWCOMER) throw new APIError(403, "Forbidden");

    const body = await request.json();
    const { fullName, phoneNumber, email } = body as {
      fullName?: string;
      phoneNumber?: string;
      email?: string;
    };

    if (!fullName || !phoneNumber || !email)
      throw new APIError(400, "Full name, phone number, and email are required");

    const arabicRegex = /[\u0600-\u06FF]/;
    if (!arabicRegex.test(fullName) || fullName.trim().length === 0)
      throw new APIError(400, "Full name must be in Arabic");

    const cleanPhone = phoneNumber.replace(/\s/g, "");
    const phoneRegex = /^\+212[5-7]\d{8}$/;
    if (!phoneRegex.test(cleanPhone))
      throw new APIError(400, "Invalid Moroccan phone number");

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail))
      throw new APIError(400, "Invalid email address");

    const { data: updatedUser, error } = await supabaseAuth
      .from("users")
      .update({
        name: fullName.trim(),
        phone: cleanPhone,
        email: cleanEmail,
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
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
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
