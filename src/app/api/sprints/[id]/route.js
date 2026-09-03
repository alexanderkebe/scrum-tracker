import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(id);
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });

  return NextResponse.json({ sprint });
}

export async function PATCH(request, { params }) {
  const user = await requireRole(['admin', 'scrum_master', 'product_owner']);
  if (!user) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const fields = [];
  const values = [];

  for (const key of ['name', 'goal', 'start_date', 'end_date']) {
    if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
  }

  if (body.active !== undefined) {
    if (body.active) db.prepare('UPDATE sprints SET active = 0').run();
    fields.push('active = ?');
    values.push(body.active ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE sprints SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(id);
  return NextResponse.json({ sprint });
}

export async function DELETE(request, { params }) {
  const user = await requireRole(['admin']);
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM sprints WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
