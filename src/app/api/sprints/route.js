import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const sprints = db.prepare('SELECT * FROM sprints ORDER BY start_date DESC').all();
  return NextResponse.json({ sprints });
}

export async function POST(request) {
  const user = await requireRole(['admin', 'scrum_master', 'product_owner']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const body = await request.json();
  if (!body.name || !body.start_date || !body.end_date) {
    return NextResponse.json({ error: 'Name, start_date, end_date required' }, { status: 400 });
  }

  const db = getDb();

  // Deactivate other sprints if this one is active
  if (body.active) {
    db.prepare('UPDATE sprints SET active = 0').run();
  }

  const id = uuidv4();
  db.prepare('INSERT INTO sprints (id, name, goal, start_date, end_date, active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, body.name, body.goal || '', body.start_date, body.end_date, body.active ? 1 : 0, user.id);

  const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(id);
  return NextResponse.json({ sprint }, { status: 201 });
}
