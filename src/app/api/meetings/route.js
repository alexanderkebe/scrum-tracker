import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sprintId = searchParams.get('sprint_id');
  const type = searchParams.get('type');

  const db = getDb();
  let query = 'SELECT m.*, u.name as creator_name FROM meetings m LEFT JOIN users u ON m.created_by = u.id';
  const conditions = [];
  const params = [];

  if (sprintId) { conditions.push('m.sprint_id = ?'); params.push(sprintId); }
  if (type) { conditions.push('m.type = ?'); params.push(type); }

  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY m.date DESC';

  const meetings = db.prepare(query).all(...params);

  // Attach attendees
  const stmtAttendees = db.prepare(
    'SELECT u.id, u.name, u.avatar_color FROM meeting_attendees ma JOIN users u ON ma.user_id = u.id WHERE ma.meeting_id = ?'
  );
  for (const m of meetings) {
    m.attendees = stmtAttendees.all(m.id);
  }

  return NextResponse.json({ meetings });
}

export async function POST(request) {
  const user = await requireRole(['admin', 'scrum_master']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const body = await request.json();
  if (!body.type || !body.date) {
    return NextResponse.json({ error: 'type and date are required' }, { status: 400 });
  }

  const db = getDb();
  const meetingId = uuidv4();

  // Get active sprint if not specified
  let sprintId = body.sprint_id;
  if (!sprintId) {
    const activeSprint = db.prepare('SELECT id FROM sprints WHERE active = 1 LIMIT 1').get();
    sprintId = activeSprint ? activeSprint.id : null;
  }

  db.prepare('INSERT INTO meetings (id, sprint_id, type, date, duration, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(meetingId, sprintId, body.type, body.date, body.duration || 0, user.id);

  // Attendees
  if (body.attendees && body.attendees.length > 0) {
    const insertAttendee = db.prepare('INSERT INTO meeting_attendees (meeting_id, user_id) VALUES (?, ?)');
    for (const uid of body.attendees) {
      insertAttendee.run(meetingId, uid);
    }
  }

  // Notes
  if (body.notes && body.notes.length > 0) {
    const insertNote = db.prepare('INSERT INTO meeting_notes (id, meeting_id, user_id, field_name, content) VALUES (?, ?, ?, ?, ?)');
    for (const note of body.notes) {
      insertNote.run(uuidv4(), meetingId, note.user_id || null, note.field_name, note.content || '');
    }
  }

  return NextResponse.json({ id: meetingId }, { status: 201 });
}
