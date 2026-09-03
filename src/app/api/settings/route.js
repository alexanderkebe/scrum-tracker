import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await getSupabase().from('settings').select('key, value');
  throwIfDbError(error);
  return NextResponse.json({ settings: Object.fromEntries(data.map(({ key, value }) => [key, value])) });
}

export async function PUT(request) {
  const user = await requireRole(['admin']);
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const body = await request.json();
  const allowed = ['companyName', 'sprintDuration', 'dailyStandupTime'];
  const rows = allowed.filter((key) => body[key] !== undefined).map((key) => ({ key, value: String(body[key]) }));
  if (rows.length) {
    const { error } = await getSupabase().from('settings').upsert(rows, { onConflict: 'key' });
    throwIfDbError(error);
  }
  return NextResponse.json({ success: true });
}
