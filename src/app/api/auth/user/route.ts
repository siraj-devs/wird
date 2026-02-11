import { getCurrentUser, removeAuthCookie } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Clear any invalid cookies
      await removeAuthCookie();
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch full user data from database
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.userId)
      .single();

    if (error || !userData) {
      // Clear invalid cookies if user not found in DB
      await removeAuthCookie();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatar_url: userData.avatar_url,
        role: userData.role,
        created_at: userData.created_at,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    // Clear cookies on any error
    await removeAuthCookie();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
