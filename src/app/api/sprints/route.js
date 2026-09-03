import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: sprints, error } = await getSupabase().from('sprints').select('*').order('start_date', { ascending: false });
  throwIfDbError(error);
  return NextResponse.json({ sprints });
}

export async function POST(request) {
  const user = await requireRole(['admin', 'scrum_master', 'product_owner']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  const body = await request.json();
  if (!body.name || !body.start_date || !body.end_date) return NextResponse.json({ error: 'Name, start_date, end_date required' }, { status: 400 });
  const supabase = getSupabase();
  if (body.active) throwIfDbError((await supabase.from('sprints').update({ active: false }).eq('active', true)).error);
  const { data: sprint, error } = await supabase.from('sprints').insert({
    name: body.name.trim(), goal: body.goal || '', start_date: body.start_date, end_date: body.end_date,
    active: Boolean(body.active), created_by: user.id
  }).select('*').single();
  throwIfDbError(error);
  return NextResponse.json({ sprint }, { status: 201 });
}
