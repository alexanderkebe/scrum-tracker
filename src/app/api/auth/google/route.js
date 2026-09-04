import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { createSession, hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) return NextResponse.json({ error: 'Missing Google access token' }, { status: 400 });

    const supabase = getSupabase();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    throwIfDbError(authError);
    const authUser = authData.user;
    const providers = authUser?.app_metadata?.providers || [];
    if (!authUser || !providers.includes('google') || !authUser.email) {
      return NextResponse.json({ error: 'Google account verification failed' }, { status: 401 });
    }

    const email = authUser.email.toLowerCase().trim();
    let { data: user, error: userError } = await supabase.from('users').select('*').eq('auth_user_id', authUser.id).maybeSingle();
    throwIfDbError(userError);

    if (!user) {
      const result = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      throwIfDbError(result.error);
      user = result.data;
    }

    if (user) {
      const { data: linkedUser, error: linkError } = await supabase.from('users')
        .update({ auth_user_id: authUser.id }).eq('id', user.id)
        .select('id, email, name, role, avatar_color').single();
      throwIfDbError(linkError);
      user = linkedUser;
    } else {
      const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });
      throwIfDbError(countError);
      const isInitialAdmin = Boolean(process.env.INITIAL_ADMIN_EMAIL)
        && email === process.env.INITIAL_ADMIN_EMAIL.toLowerCase().trim() && count === 0;
      const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0];
      const result = await supabase.from('users').insert({
        auth_user_id: authUser.id, email, name, password_hash: hashPassword(uuidv4()),
        role: isInitialAdmin ? 'admin' : 'member', avatar_color: Math.floor(Math.random() * 15)
      }).select('id, email, name, role, avatar_color').single();
      throwIfDbError(result.error);
      user = result.data;
    }

    await createSession(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return NextResponse.json({ error: error.message || 'Could not complete Google sign-in' }, { status: 500 });
  }
}
