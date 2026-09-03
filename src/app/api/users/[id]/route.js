import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { requireAuth, hashPassword, verifyPassword } from '@/lib/auth';

const safeFields = 'id, email, name, role, avatar_color, created_at';

export async function GET(_request, { params }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data: profile, error } = await getSupabase().from('users').select(safeFields).eq('id', id).maybeSingle();
  throwIfDbError(error);
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: profile });
}

export async function PATCH(request, { params }) {
  const currentUser = await requireAuth();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (currentUser.id !== id && currentUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  const supabase = getSupabase();
  const update = {};
  if (body.name?.trim()) update.name = body.name.trim();
  if (Number.isInteger(body.avatar_color) && body.avatar_color >= 0 && body.avatar_color <= 14) update.avatar_color = body.avatar_color;
  if (body.role && currentUser.role === 'admin') {
    const validRoles = ['admin', 'product_owner', 'scrum_master', 'member'];
    if (!validRoles.includes(body.role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    update.role = body.role;
  }
  if (body.currentPassword || body.newPassword) {
    if (!body.currentPassword || !body.newPassword) return NextResponse.json({ error: 'Provide both current and new passwords' }, { status: 400 });
    if (body.newPassword.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    const { data: account, error } = await supabase.from('users').select('password_hash').eq('id', id).maybeSingle();
    throwIfDbError(error);
    if (!account || !verifyPassword(body.currentPassword, account.password_hash)) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    update.password_hash = hashPassword(body.newPassword);
  }
  const { data: user, error } = await supabase.from('users').update(update).eq('id', id).select(safeFields).maybeSingle();
  throwIfDbError(error);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function DELETE(_request, { params }) {
  const admin = await requireAuth();
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const { id } = await params;
  if (admin.id === id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  const { error } = await getSupabase().from('users').delete().eq('id', id);
  throwIfDbError(error);
  return NextResponse.json({ success: true });
}
