import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sprintId = searchParams.get('sprint_id');
  const status = searchParams.get('status');
  const assigneeId = searchParams.get('assignee_id');

  const db = getDb();
  let query = 'SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id';
  const conditions = [];
  const params = [];

  if (sprintId) { conditions.push('t.sprint_id = ?'); params.push(sprintId); }
  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (assigneeId) { conditions.push('t.assignee_id = ?'); params.push(assigneeId); }

  // Members only see their own tasks or all tasks for viewing
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  return NextResponse.json({ tasks });
}

export async function POST(request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const db = getDb();

  let sprintId = body.sprint_id;
  if (!sprintId) {
    const activeSprint = db.prepare('SELECT id FROM sprints WHERE active = 1 LIMIT 1').get();
    sprintId = activeSprint ? activeSprint.id : null;
  }

  const id = uuidv4();
  db.prepare('INSERT INTO tasks (id, sprint_id, title, description, points, status, priority, assignee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, sprintId, body.title, body.description || '', body.points || 0, body.status || 'todo', body.priority || 'medium', body.assignee_id || null);

  const task = db.prepare('SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?').get(id);
  return NextResponse.json({ task }, { status: 201 });
}
