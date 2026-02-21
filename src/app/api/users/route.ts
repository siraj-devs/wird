import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user session
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("user_id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Get user role
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", session.user_id)
    .single();

  if (!user || !["admin", "owner"].includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden - Admin role required" },
      { status: 403 },
    );
  }

  // Get all users with their roles
  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("id, username, email, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user session
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("user_id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Get request body
  const body = await request.json();
  const { fullName, phoneNumber } = body;

  // Validate inputs
  if (!fullName || !phoneNumber) {
    return NextResponse.json(
      { error: "Full name and phone number are required" },
      { status: 400 },
    );
  }

  // Validate Arabic text
  const arabicRegex = /[\u0600-\u06FF]/;
  if (!arabicRegex.test(fullName) || fullName.trim().length === 0) {
    return NextResponse.json(
      { error: "Full name must be in Arabic" },
      { status: 400 },
    );
  }

  // Validate Moroccan phone number
  const cleanPhone = phoneNumber.replace(/\s/g, "");
  const phoneRegex = /^[5-7]\d{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return NextResponse.json(
      { error: "Invalid Moroccan phone number" },
      { status: 400 },
    );
  }

  try {
    // Update user profile and change role from newcomer to guest
    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update({
        full_name: fullName.trim(),
        phone_number: cleanPhone,
        role: "guest",
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

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
