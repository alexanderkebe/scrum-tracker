import { NextResponse } from 'next/server';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
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

    const supabase = getSupabase();
    const normalizedEmail = email.toLowerCase().trim();
    const { data: existing, error: existingError } = await supabase.from('users').select('id')
      .eq('email', normalizedEmail).maybeSingle();
    throwIfDbError(existingError);

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });
    throwIfDbError(countError);
    const isInitialAdmin = Boolean(process.env.INITIAL_ADMIN_EMAIL)
      && normalizedEmail === process.env.INITIAL_ADMIN_EMAIL.toLowerCase().trim()
      && count === 0;
    const role = isInitialAdmin ? 'admin' : 'member';

    const { data: user, error: insertError } = await supabase.from('users').insert({
      email: normalizedEmail, name: name.trim(), password_hash: passwordHash, role,
      avatar_color: Math.floor(Math.random() * 15)
    }).select('id, email, name, role, avatar_color').single();
    throwIfDbError(insertError);

    await createSession(user.id);

    return NextResponse.json({
      user
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
