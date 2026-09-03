import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const activeSprint = db.prepare('SELECT * FROM sprints WHERE active = 1 LIMIT 1').get();

  if (!activeSprint) {
    return NextResponse.json({
      sprint: null,
      meetings: { total: 0, byType: {} },
      tasks: { total: 0, byStatus: {}, totalPoints: 0, donePoints: 0 },
      team: { total: 0, attendance: [] },
      blockers: 0,
      meetingDurations: []
    });
  }

  // Meetings stats
  const meetings = db.prepare('SELECT * FROM meetings WHERE sprint_id = ? ORDER BY date ASC').all(activeSprint.id);
  const meetingsByType = {};
  meetings.forEach(m => {
    meetingsByType[m.type] = (meetingsByType[m.type] || 0) + 1;
  });

  // Task stats
  const tasks = db.prepare('SELECT * FROM tasks WHERE sprint_id = ?').all(activeSprint.id);
  const byStatus = { todo: 0, progress: 0, review: 0, done: 0 };
  let totalPoints = 0, donePoints = 0;
  tasks.forEach(t => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    totalPoints += t.points || 0;
    if (t.status === 'done') donePoints += t.points || 0;
  });

  // Team stats & attendance
  const users = db.prepare('SELECT id, name, avatar_color FROM users').all();
  const attendance = users.map(u => {
    const attended = db.prepare(
      'SELECT COUNT(*) as cnt FROM meeting_attendees ma JOIN meetings m ON ma.meeting_id = m.id WHERE ma.user_id = ? AND m.sprint_id = ?'
    ).get(u.id, activeSprint.id).cnt;
    return { ...u, attended, total: meetings.length, pct: meetings.length > 0 ? Math.round((attended / meetings.length) * 100) : 0 };
  });

  // Blockers details
  const blockers = db.prepare(
    "SELECT COUNT(*) as cnt FROM meeting_notes WHERE meeting_id IN (SELECT id FROM meetings WHERE sprint_id = ?) AND field_name = 'blockers' AND content != ''"
  ).get(activeSprint.id).cnt;

  const recentBlockers = db.prepare(`
    SELECT mn.content as blocker, u.name as reported_by, u.avatar_color, m.date
    FROM meeting_notes mn
    JOIN meetings m ON mn.meeting_id = m.id
    LEFT JOIN users u ON mn.user_id = u.id
    WHERE m.sprint_id = ? AND mn.field_name = 'blockers' AND mn.content != ''
    ORDER BY m.date DESC LIMIT 4
  `).all(activeSprint.id);

  // Settings for ceremony times
  const standupSetting = db.prepare("SELECT value FROM settings WHERE key = 'dailyStandupTime'").get();
  const dailyStandupTime = standupSetting ? standupSetting.value : '09:30';

  // Meeting durations for chart
  const meetingDurations = meetings.map(m => ({
    date: m.date, type: m.type, duration: m.duration
  }));

  // Personal stats for members
  let personalTasks = null;
  let personalMeetings = null;
  if (user.role === 'member') {
    personalTasks = tasks.filter(t => t.assignee_id === user.id);
    personalMeetings = db.prepare(
      'SELECT COUNT(*) as cnt FROM meeting_attendees WHERE user_id = ? AND meeting_id IN (SELECT id FROM meetings WHERE sprint_id = ?)'
    ).get(user.id, activeSprint.id).cnt;
  }

  return NextResponse.json({
    sprint: activeSprint,
    meetings: { total: meetings.length, byType: meetingsByType },
    tasks: { total: tasks.length, byStatus, totalPoints, donePoints },
    team: { total: users.length, attendance },
    blockers,
    recentBlockers,
    dailyStandupTime,
    meetingDurations,
    personal: personalTasks ? {
      tasks: personalTasks.length,
      doneTasks: personalTasks.filter(t => t.status === 'done').length,
      meetings: personalMeetings
    } : null
  });
}
