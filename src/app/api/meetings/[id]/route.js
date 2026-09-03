import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const meeting = db.prepare('SELECT m.*, u.name as creator_name FROM meetings m LEFT JOIN users u ON m.created_by = u.id WHERE m.id = ?').get(id);
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

  meeting.attendees = db.prepare(
    'SELECT u.id, u.name, u.role, u.avatar_color FROM meeting_attendees ma JOIN users u ON ma.user_id = u.id WHERE ma.meeting_id = ?'
  ).all(id);

  meeting.notes = db.prepare(
    'SELECT mn.*, u.name as user_name FROM meeting_notes mn LEFT JOIN users u ON mn.user_id = u.id WHERE mn.meeting_id = ?'
  ).all(id);

  return NextResponse.json({ meeting });
}

export async function DELETE(request, { params }) {
  const user = await requireRole(['admin', 'scrum_master', 'product_owner']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM meetings WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
