import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user session
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('user_id')
    .eq('token', token)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Get user role
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', session.user_id)
    .single();

  if (!user || !['owner'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden - Owner role required' }, { status: 403 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }

  const { data: category, error } = await supabaseAdmin
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user session
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('user_id')
    .eq('token', token)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Get user role
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', session.user_id)
    .single();

  if (!user || !['owner'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden - Owner role required' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Category deleted successfully' });
}
