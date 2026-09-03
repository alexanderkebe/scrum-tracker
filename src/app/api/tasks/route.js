import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth, requireRole } from '@/lib/auth';

const taskSelect = '*, assignee:users!tasks_assignee_id_fkey(name, avatar_color)';
const taskResponse = (task) => task && ({ ...task, assignee_name: task.assignee?.name ?? null, assignee_color: task.assignee?.avatar_color ?? null, assignee: undefined });

export async function GET(request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  let query = getSupabase().from('tasks').select(taskSelect).order('created_at', { ascending: false });
  for (const [key, column] of [['sprint_id', 'sprint_id'], ['status', 'status'], ['assignee_id', 'assignee_id']]) {
    const value = searchParams.get(key);
    if (value) query = query.eq(column, value);
  }
  const { data: tasks, error } = await query;
  throwIfDbError(error);
  return NextResponse.json({ tasks: tasks.map(taskResponse) });
}

export async function POST(request) {
  const user = await requireRole(['admin', 'scrum_master', 'product_owner']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });
  const supabase = getSupabase();
  let sprintId = body.sprint_id || null;
  if (!sprintId) {
    const { data: activeSprint, error } = await supabase.from('sprints').select('id').eq('active', true).maybeSingle();
    throwIfDbError(error);
    sprintId = activeSprint?.id || null;
  }
  const { data: task, error } = await supabase.from('tasks').insert({
    sprint_id: sprintId, title: body.title.trim(), description: body.description || '', points: Number(body.points) || 0,
    status: body.status || 'todo', priority: body.priority || 'medium', assignee_id: body.assignee_id || null
  }).select(taskSelect).single();
  throwIfDbError(error);
  return NextResponse.json({ task: taskResponse(task) }, { status: 201 });
}
