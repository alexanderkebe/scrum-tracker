import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: users, error } = await getSupabase().from('users')
    .select('id, email, name, role, avatar_color, created_at').order('name');
  throwIfDbError(error);
  return NextResponse.json({ users });
}

export async function PATCH(request) {
  const admin = await requireRole(['admin']);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const { userId, role } = await request.json();
  const validRoles = ['admin', 'product_owner', 'scrum_master', 'member'];
  if (!userId || !validRoles.includes(role)) return NextResponse.json({ error: 'Valid userId and role required' }, { status: 400 });
  const { data: user, error } = await getSupabase().from('users').update({ role }).eq('id', userId)
    .select('id, email, name, role, avatar_color, created_at').maybeSingle();
  throwIfDbError(error);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user });
}
