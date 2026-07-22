import { APIError, checkAuth } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseNew } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id } = await params;

    const { error } = await supabaseNew.from("programs").delete().eq("id", id);
    if (error) throw new APIError(500, error.message);

    return NextResponse.json({ ok: true });
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
