import { APIError, checkAuth } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { supabaseNew } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await params;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) throw new APIError(400, "Category name is required");

    const { data: existing } = await supabaseNew
      .from("program_categories")
      .select("sort_order")
      .eq("program_id", programId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const sort_order = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabaseNew
      .from("program_categories")
      .insert({ program_id: programId, name, sort_order })
      .select()
      .single();

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ category: data }, { status: 201 });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await params;
    const body = await request.json();
    const categoryId = body.category_id as string | undefined;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!categoryId) throw new APIError(400, "category_id is required");
    if (!name) throw new APIError(400, "Category name is required");

    const { data, error } = await supabaseNew
      .from("program_categories")
      .update({ name })
      .eq("id", categoryId)
      .eq("program_id", programId)
      .select()
      .single();

    if (error) throw new APIError(500, error.message);
    return NextResponse.json({ category: data });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth(request, ROLES.OWNER, ROLES.ADMIN);
    const { id: programId } = await params;
    const categoryId = request.nextUrl.searchParams.get("category_id");
    if (!categoryId) throw new APIError(400, "category_id is required");

    const { error } = await supabaseNew
      .from("program_categories")
      .delete()
      .eq("id", categoryId)
      .eq("program_id", programId);

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
