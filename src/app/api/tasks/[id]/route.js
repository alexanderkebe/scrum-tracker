import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

const taskSelect = '*, assignee:users!tasks_assignee_id_fkey(name, avatar_color)';
const shapeTask = (task) => ({ ...task, assignee_name: task.assignee?.name ?? null, assignee_color: task.assignee?.avatar_color ?? null, assignee: undefined });

export async function PATCH(request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabase();
  const { data: current, error: currentError } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
  throwIfDbError(currentError);
  if (!current) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (user.role === 'member') {
    if (current.assignee_id !== user.id) return NextResponse.json({ error: 'Members can only update their own tasks' }, { status: 403 });
    if (Object.keys(body).some((key) => key !== 'status')) return NextResponse.json({ error: 'Members can only update task status' }, { status: 403 });
  }
  const update = {};
  for (const key of ['title', 'description', 'status', 'priority', 'assignee_id', 'points']) if (body[key] !== undefined) update[key] = body[key];
  const { data: task, error } = await supabase.from('tasks').update(update).eq('id', id).select(taskSelect).maybeSingle();
  throwIfDbError(error);
  return NextResponse.json({ task: shapeTask(task) });
}

export async function DELETE(_request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabase();
  const { data: task, error: taskError } = await supabase.from('tasks').select('assignee_id').eq('id', id).maybeSingle();
  throwIfDbError(taskError);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  const canManage = ['admin', 'scrum_master', 'product_owner'].includes(user.role);
  if (!canManage && task.assignee_id !== user.id) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  throwIfDbError(error);
  return NextResponse.json({ success: true });
}
