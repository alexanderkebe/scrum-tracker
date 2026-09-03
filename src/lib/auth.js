import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { getDb } from './db';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_COOKIE = 'scrum_session';

/**
 * Hash a password
 */
export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

/**
 * Create a session for a user, set cookie
 */
export async function createSession(userId) {
  const db = getDb();
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sessionId, userId, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000
  });

  return sessionId;
}

/**
 * Get the current user from the session cookie
 * Returns null if no valid session
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie) return null;

    const db = getDb();
    const session = db.prepare(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime(\'now\')'
    ).get(sessionCookie.value);

    if (!session) return null;

    const user = db.prepare(
      'SELECT id, email, name, role, avatar_color, created_at FROM users WHERE id = ?'
    ).get(session.user_id);

    return user || null;
  } catch {
    return null;
  }
}

/**
 * Destroy the current session
 */
export async function destroySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (sessionCookie) {
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionCookie.value);
    cookieStore.delete(SESSION_COOKIE);
  }
}

/**
 * Check if a user has a required role
 */
export function hasRole(user, requiredRoles) {
  if (!user) return false;
  if (typeof requiredRoles === 'string') requiredRoles = [requiredRoles];
  return requiredRoles.includes(user.role);
}

/**
 * Require authentication — returns user or throws response
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return user;
}

/**
 * Require specific role(s)
 */
export async function requireRole(roles) {
  const user = await requireAuth();
  if (!user) return null;
  if (!hasRole(user, roles)) return null;
  return user;
}

/**
 * Avatar colors palette
 */
export const AVATAR_COLORS = [
  '#1E1B4B', '#008080', '#DC2626', '#D97706', '#059669',
  '#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#65A30D',
  '#EA580C', '#4F46E5', '#0D9488', '#B91C1C', '#CA8A04'
];

export function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
