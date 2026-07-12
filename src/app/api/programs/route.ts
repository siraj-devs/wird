import { checkAuth } from "@/lib/api";
import { APIError } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);

    const { data: programs, error } = await supabaseAdmin
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ programs });
  } catch (error: unknown) {
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

export async function POST(request: NextRequest) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new APIError(400, "name is required");
    }

    const { data: program, error } = await supabaseAdmin
      .from("programs")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ program }, { status: 201 });
  } catch (error: unknown) {
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
