import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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

  if (!user || !['member', 'admin', 'owner'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden - Member role required' }, { status: 403 });
  }

  // Get all categories
  const { data: categories, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
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

  if (!user || !['admin', 'owner'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
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
