import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, hashPassword, verifyPassword } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const profile = db.prepare('SELECT id, email, name, role, avatar_color, created_at FROM users WHERE id = ?').get(id);

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: profile });
}

export async function PATCH(request, { params }) {
  const currentUser = await requireAuth();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Users can only edit their own profile (unless admin)
  if (currentUser.id !== id && currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const db = getDb();

  // Update name
  if (body.name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(body.name.trim(), id);
  }

  // Update avatar color
  if (body.avatar_color !== undefined) {
    db.prepare('UPDATE users SET avatar_color = ? WHERE id = ?').run(body.avatar_color, id);
  }

  // Change password
  if (body.currentPassword && body.newPassword) {
    const userRecord = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id);
    if (!verifyPassword(body.currentPassword, userRecord.password_hash)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(body.newPassword), id);
  }

  // Admin can change role
  if (body.role && currentUser.role === 'admin') {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(body.role, id);
  }

  const updated = db.prepare('SELECT id, email, name, role, avatar_color, created_at FROM users WHERE id = ?').get(id);
  return NextResponse.json({ user: updated });
}

export async function DELETE(request, { params }) {
  const admin = await requireAuth();
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { id } = await params;
  if (admin.id === id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
