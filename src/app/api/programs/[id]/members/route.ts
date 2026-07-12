import { checkAuth } from "@/lib/api";
import { APIError } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await context.params;

    const body = await request.json();
    const { user_ids } = body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      throw new APIError(400, "user_ids array is required");
    }

    const rows = user_ids.map((userId: string) => ({
      program_id: programId,
      user_id: userId,
    }));

    const { data: members, error } = await supabaseAdmin
      .from("program_members")
      .upsert(rows, { onConflict: "program_id,user_id", ignoreDuplicates: true })
      .select();

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ members }, { status: 201 });
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await context.params;

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");

    if (!userId) {
      throw new APIError(400, "user_id query parameter is required");
    }

    const { error } = await supabaseAdmin
      .from("program_members")
      .delete()
      .eq("program_id", programId)
      .eq("user_id", userId);

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ message: "Member removed successfully" });
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
