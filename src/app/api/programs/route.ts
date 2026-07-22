import { APIError, checkAuth } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseNew } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);

    const { data, error } = await supabaseNew
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ programs: data ?? [] });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : null;

    if (!name) throw new APIError(400, "Program name is required");

    const { data, error } = await supabaseNew
      .from("programs")
      .insert({ name, description: description || null })
      .select()
      .single();

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ program: data }, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
