import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Members can only move their own tasks
  if (user.role === 'member' && task.assignee_id !== user.id) {
    // Allow status changes only
    if (Object.keys(body).some(k => k !== 'status')) {
      return NextResponse.json({ error: 'Members can only update their own tasks' }, { status: 403 });
    }
  }

  const fields = [];
  const values = [];

  for (const key of ['title', 'description', 'status', 'priority', 'assignee_id']) {
    if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
  }
  if (body.points !== undefined) { fields.push('points = ?'); values.push(body.points); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?').get(id);
  return NextResponse.json({ task: updated });
}

export async function DELETE(request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  // Only admin/SM can delete, or the assignee
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  if (user.role === 'member' && task.assignee_id !== user.id) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
