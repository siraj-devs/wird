import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromSession } from '@/lib/auth-db';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authUser = await getAuthUserFromSession(token);
  if (!authUser) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  if (!['owner'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden - Owner role required' }, { status: 403 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }

  const { data: category, error } = await supabaseAdmin
    .from('categories')
    .insert({ name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category }, { status: 201 });
}
