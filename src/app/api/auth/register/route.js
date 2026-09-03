import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const userId = uuidv4();
    const passwordHash = hashPassword(password);

    db.prepare('INSERT INTO users (id, email, name, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, email.toLowerCase().trim(), name.trim(), passwordHash, 'member', Math.floor(Math.random() * 15));

    await createSession(userId);

    return NextResponse.json({
      user: { id: userId, email: email.toLowerCase().trim(), name: name.trim(), role: 'member' }
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
