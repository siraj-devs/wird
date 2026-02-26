import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user session
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('user_id')
    .gte('expires_at', new Date().toISOString())
    .eq('token', token)
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
  const { name, category_id, is_active, frequency, weekly_days, start_date, end_date, assigned_user_ids } = body;

  if (!name) {
    return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
  }

  // Create task
  const { data: task, error: taskError } = await supabaseAdmin
    .from('tasks')
    .insert({
      name,
      category_id: category_id || null,
      is_active: is_active !== undefined ? is_active : true,
      frequency: frequency || 'daily',
      weekly_days: weekly_days || null,
      start_date: start_date || null,
      end_date: end_date || null,
    })
    .select()
    .single();

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  // Assign task to users if specified
  if (assigned_user_ids && assigned_user_ids.length > 0) {
    const userTasks = assigned_user_ids.map((user_id: string) => ({
      user_id,
      task_id: task.id,
    }));

    const { error: assignError } = await supabaseAdmin
      .from('user_tasks')
      .insert(userTasks);

    if (assignError) {
      // Rollback task creation if assignment fails
      await supabaseAdmin.from('tasks').delete().eq('id', task.id);
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ task }, { status: 201 });
}
