import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const settings = db.prepare('SELECT * FROM settings').all();
  const result = {};
  settings.forEach(s => { result[s.key] = s.value; });

  return NextResponse.json({ settings: result });
}

export async function PUT(request) {
  const user = await requireRole(['admin']);
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const body = await request.json();
  const db = getDb();

  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?');
  for (const [key, value] of Object.entries(body)) {
    upsert.run(key, String(value), String(value));
  }

  return NextResponse.json({ success: true });
}
