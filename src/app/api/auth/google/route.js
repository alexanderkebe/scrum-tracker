import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase, throwIfDbError } from '@/lib/supabase';
import { createSession, hashPassword } from '@/lib/auth';
import { createGoogleAuthClient, isSameOrigin } from '@/lib/google-auth-server';

export async function POST(request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid sign-in request.' }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const code = body?.code;
    if (typeof code !== 'string' || !code.trim()) return NextResponse.json({ error: 'Missing Google sign-in code' }, { status: 400 });

    const auth = await createGoogleAuthClient();
    const { data: sessionData, error: exchangeError } = await auth.auth.exchangeCodeForSession(code);
    if (exchangeError || !sessionData.session) {
      return NextResponse.json({ error: 'Your Google sign-in has expired or was started in another browser. Please start again.' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: authData, error: authError } = await auth.auth.getUser(sessionData.session.access_token);
    const authUser = authData.user;
    const providers = authUser?.app_metadata?.providers || [];
    if (authError || !authUser || !providers.includes('google') || !authUser.email || !authUser.email_confirmed_at) {
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
      if (user.auth_user_id && user.auth_user_id !== authUser.id) {
        return NextResponse.json({ error: 'This email is already linked to another account. Please contact your workspace administrator.' }, { status: 409 });
      }
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
    return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return NextResponse.json({ error: 'Could not complete Google sign-in. Please try again or contact your workspace administrator.' }, { status: 500 });
  }
}
