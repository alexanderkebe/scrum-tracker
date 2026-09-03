import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { getSupabase, throwIfDbError } from './supabase';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE = 'scrum_session';

export function hashPassword(password) { return bcrypt.hashSync(password, 10); }
export function verifyPassword(password, hash) { return bcrypt.compareSync(password, hash); }

export async function createSession(userId) {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const { error } = await getSupabase().from('sessions').insert({ id: sessionId, user_id: userId, expires_at: expiresAt });
  throwIfDbError(error);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: SESSION_DURATION_MS / 1000
  });
  return sessionId;
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie) return null;

    const supabase = getSupabase();
    const { data: session, error: sessionError } = await supabase.from('sessions').select('user_id')
      .eq('id', sessionCookie.value).gt('expires_at', new Date().toISOString()).maybeSingle();
    throwIfDbError(sessionError);
    if (!session) return null;

    const { data: user, error: userError } = await supabase.from('users')
      .select('id, email, name, role, avatar_color, created_at').eq('id', session.user_id).maybeSingle();
    throwIfDbError(userError);
    return user || null;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (sessionCookie) {
    const { error } = await getSupabase().from('sessions').delete().eq('id', sessionCookie.value);
    throwIfDbError(error);
    cookieStore.delete(SESSION_COOKIE);
  }
}

export function hasRole(user, requiredRoles) {
  if (!user) return false;
  const roles = typeof requiredRoles === 'string' ? [requiredRoles] : requiredRoles;
  return roles.includes(user.role);
}

export async function requireAuth() { return getCurrentUser(); }
export async function requireRole(roles) {
  const user = await requireAuth();
  return hasRole(user, roles) ? user : null;
}
