import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const users = db.prepare('SELECT id, email, name, role, avatar_color, created_at FROM users ORDER BY name').all();
  return NextResponse.json({ users });
}

export async function PATCH(request) {
  const admin = await requireRole(['admin']);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { userId, role } = await request.json();
  if (!userId || !role) return NextResponse.json({ error: 'userId and role required' }, { status: 400 });

  const validRoles = ['admin', 'product_owner', 'scrum_master', 'member'];
  if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const db = getDb();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  return NextResponse.json({ success: true });
}
