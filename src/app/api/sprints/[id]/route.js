import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(_request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data: sprint, error } = await getSupabase().from('sprints').select('*').eq('id', id).maybeSingle();
  throwIfDbError(error);
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  return NextResponse.json({ sprint });
}

export async function PATCH(request, { params }) {
  const user = await requireRole(['admin', 'scrum_master', 'product_owner']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const update = {};
  for (const key of ['name', 'goal', 'start_date', 'end_date', 'active']) if (body[key] !== undefined) update[key] = body[key];
  const supabase = getSupabase();
  if (body.active) throwIfDbError((await supabase.from('sprints').update({ active: false }).eq('active', true).neq('id', id)).error);
  const { data: sprint, error } = await supabase.from('sprints').update(update).eq('id', id).select('*').maybeSingle();
  throwIfDbError(error);
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  return NextResponse.json({ sprint });
}

export async function DELETE(_request, { params }) {
  const user = await requireRole(['admin']);
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const { id } = await params;
  const { error } = await getSupabase().from('sprints').delete().eq('id', id);
  throwIfDbError(error);
  return NextResponse.json({ success: true });
}
