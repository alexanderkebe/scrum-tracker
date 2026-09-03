import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  let query = getSupabase().from('meetings').select('*, creator:users!meetings_created_by_fkey(name)')
    .order('date', { ascending: false });
  if (searchParams.get('sprint_id')) query = query.eq('sprint_id', searchParams.get('sprint_id'));
  if (searchParams.get('type')) query = query.eq('type', searchParams.get('type'));
  const { data: meetings, error } = await query;
  throwIfDbError(error);
  const ids = meetings.map((meeting) => meeting.id);
  let attendees = [];
  if (ids.length) {
    const result = await getSupabase().from('meeting_attendees')
      .select('meeting_id, user:users(id, name, avatar_color)').in('meeting_id', ids);
    throwIfDbError(result.error);
    attendees = result.data;
  }
  const byMeeting = new Map();
  attendees.forEach(({ meeting_id, user: attendee }) => byMeeting.set(meeting_id, [...(byMeeting.get(meeting_id) || []), attendee]));
  return NextResponse.json({ meetings: meetings.map(({ creator, ...meeting }) => ({
    ...meeting, creator_name: creator?.name ?? null, attendees: byMeeting.get(meeting.id) || []
  })) });
}

export async function POST(request) {
  const user = await requireRole(['admin', 'scrum_master', 'product_owner']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  const body = await request.json();
  const validTypes = ['standup', 'planning', 'review', 'retro'];
  if (!validTypes.includes(body.type) || !body.date || Number(body.duration) < 0) return NextResponse.json({ error: 'Valid type, date, and duration are required' }, { status: 400 });
  const supabase = getSupabase();
  let sprintId = body.sprint_id || null;
  if (!sprintId) {
    const { data: activeSprint, error } = await supabase.from('sprints').select('id').eq('active', true).maybeSingle();
    throwIfDbError(error);
    sprintId = activeSprint?.id || null;
  }
  const { data: meeting, error } = await supabase.from('meetings').insert({
    sprint_id: sprintId, type: body.type, date: body.date, duration: Number(body.duration) || 0, created_by: user.id
  }).select('id').single();
  throwIfDbError(error);
  const attendeeRows = [...new Set(body.attendees || [])].map((user_id) => ({ meeting_id: meeting.id, user_id }));
  if (attendeeRows.length) throwIfDbError((await supabase.from('meeting_attendees').insert(attendeeRows)).error);
  const noteRows = (body.notes || []).filter((note) => note.field_name && note.content?.trim()).map((note) => ({
    meeting_id: meeting.id, user_id: note.user_id || null, field_name: note.field_name, content: note.content.trim()
  }));
  if (noteRows.length) throwIfDbError((await supabase.from('meeting_notes').insert(noteRows)).error);
  return NextResponse.json({ id: meeting.id }, { status: 201 });
}
