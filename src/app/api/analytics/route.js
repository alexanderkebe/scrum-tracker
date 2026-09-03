import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabase();
  const { data: sprint, error: sprintError } = await supabase.from('sprints').select('*').eq('active', true).maybeSingle();
  throwIfDbError(sprintError);
  if (!sprint) return NextResponse.json({
    sprint: null, meetings: { total: 0, byType: {} }, tasks: { total: 0, byStatus: {}, totalPoints: 0, donePoints: 0 },
    team: { total: 0, attendance: [] }, blockers: 0, recentBlockers: [], meetingDurations: [], personal: null
  });

  const [meetingsResult, tasksResult, usersResult, settingsResult] = await Promise.all([
    supabase.from('meetings').select('*').eq('sprint_id', sprint.id).order('date'),
    supabase.from('tasks').select('*').eq('sprint_id', sprint.id),
    supabase.from('users').select('id, name, avatar_color'),
    supabase.from('settings').select('value').eq('key', 'dailyStandupTime').maybeSingle()
  ]);
  [meetingsResult, tasksResult, usersResult, settingsResult].forEach((result) => throwIfDbError(result.error));
  const meetings = meetingsResult.data;
  const tasks = tasksResult.data;
  const users = usersResult.data;
  const meetingIds = meetings.map((meeting) => meeting.id);
  const [attendanceResult, notesResult] = meetingIds.length ? await Promise.all([
    supabase.from('meeting_attendees').select('meeting_id, user_id').in('meeting_id', meetingIds),
    supabase.from('meeting_notes').select('meeting_id, user_id, field_name, content, user:users!meeting_notes_user_id_fkey(name, avatar_color)').in('meeting_id', meetingIds)
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  throwIfDbError(attendanceResult.error);
  throwIfDbError(notesResult.error);

  const meetingsByType = {};
  meetings.forEach((meeting) => { meetingsByType[meeting.type] = (meetingsByType[meeting.type] || 0) + 1; });
  const byStatus = { todo: 0, progress: 0, review: 0, done: 0 };
  let totalPoints = 0;
  let donePoints = 0;
  tasks.forEach((task) => {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    totalPoints += task.points || 0;
    if (task.status === 'done') donePoints += task.points || 0;
  });
  const attendanceByUser = new Map();
  attendanceResult.data.forEach(({ user_id }) => attendanceByUser.set(user_id, (attendanceByUser.get(user_id) || 0) + 1));
  const attendance = users.map((teamUser) => {
    const attended = attendanceByUser.get(teamUser.id) || 0;
    return { ...teamUser, attended, total: meetings.length, pct: meetings.length ? Math.round((attended / meetings.length) * 100) : 0 };
  });
  const meetingById = new Map(meetings.map((meeting) => [meeting.id, meeting]));
  const blockerNotes = notesResult.data.filter((note) => note.field_name === 'blockers' && note.content.trim());
  const recentBlockers = blockerNotes.map((note) => ({
    blocker: note.content, reported_by: note.user?.name ?? null, avatar_color: note.user?.avatar_color ?? 0,
    date: meetingById.get(note.meeting_id)?.date
  })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  const personalTasks = user.role === 'member' ? tasks.filter((task) => task.assignee_id === user.id) : null;

  return NextResponse.json({
    sprint, meetings: { total: meetings.length, byType: meetingsByType },
    tasks: { total: tasks.length, byStatus, totalPoints, donePoints }, team: { total: users.length, attendance },
    blockers: blockerNotes.length, recentBlockers, dailyStandupTime: settingsResult.data?.value || '09:30',
    meetingDurations: meetings.map(({ date, type, duration }) => ({ date, type, duration })),
    personal: personalTasks ? {
      tasks: personalTasks.length, doneTasks: personalTasks.filter((task) => task.status === 'done').length,
      meetings: attendanceByUser.get(user.id) || 0
    } : null
  });
}
