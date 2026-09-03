import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(_request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabase();
  const { data: row, error } = await supabase.from('meetings').select('*, creator:users!meetings_created_by_fkey(name)').eq('id', id).maybeSingle();
  throwIfDbError(error);
  if (!row) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  const [attendeeResult, noteResult] = await Promise.all([
    supabase.from('meeting_attendees').select('user:users(id, name, role, avatar_color)').eq('meeting_id', id),
    supabase.from('meeting_notes').select('*, user:users(name)').eq('meeting_id', id)
  ]);
  throwIfDbError(attendeeResult.error);
  throwIfDbError(noteResult.error);
  const { creator, ...meeting } = row;
  return NextResponse.json({ meeting: {
    ...meeting, creator_name: creator?.name ?? null,
    attendees: attendeeResult.data.map(({ user: attendee }) => attendee),
    notes: noteResult.data.map(({ user: noteUser, ...note }) => ({ ...note, user_name: noteUser?.name ?? null }))
  } });
}

export async function DELETE(_request, { params }) {
  const user = await requireRole(['admin', 'scrum_master', 'product_owner']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  const { id } = await params;
  const { error } = await getSupabase().from('meetings').delete().eq('id', id);
  throwIfDbError(error);
  return NextResponse.json({ success: true });
}
