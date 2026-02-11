import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
//   const supabase = getSupabase();
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

  if (!user || !['admin', 'owner'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
  }

  const body = await request.json();
  const { user_ids } = body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: 'user_ids array is required' }, { status: 400 });
  }

  // Create user task assignments
  const userTasks = user_ids.map((user_id: string) => ({
    user_id,
    task_id: id,
  }));

  const { data, error } = await supabaseAdmin
    .from('user_tasks')
    .upsert(userTasks, { onConflict: 'user_id,task_id' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assignments: data }, { status: 201 });
}
