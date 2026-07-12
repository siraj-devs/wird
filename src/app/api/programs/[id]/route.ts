import { checkAuth } from "@/lib/api";
import { APIError } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id } = await context.params;

    const { error } = await supabaseAdmin.from("programs").delete().eq("id", id);

    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ message: "Program deleted successfully" });
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
