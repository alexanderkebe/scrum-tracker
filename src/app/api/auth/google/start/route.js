import { NextResponse } from 'next/server';
import { createGoogleAuthClient, isSameOrigin } from '@/lib/google-auth-server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid sign-in request.' }, { status: 403 });
  try {
    const auth = await createGoogleAuthClient();
    const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      cache: 'no-store', signal: AbortSignal.timeout(10000)
    });
    if (!settingsResponse.ok) throw new Error('Could not check Google sign-in availability. Please try again.');
    const settings = await settingsResponse.json();
    if (!settings.external?.google) {
      return NextResponse.json({ error: 'Google sign-in is not enabled yet. Please contact your workspace administrator or continue with email.' }, { status: 503 });
    }
    const { error: schemaError } = await getSupabase().from('users').select('auth_user_id').limit(0);
    if (schemaError) {
      console.error('Google sign-in database readiness:', schemaError.code);
      return NextResponse.json({ error: 'Google sign-in setup is incomplete. Please contact your workspace administrator.' }, { status: 503 });
    }
    const { data, error } = await auth.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${request.headers.get('origin')}/auth/callback`,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error || !data.url) throw new Error('Could not start Google sign-in. Please try again.');
    return NextResponse.json({ url: data.url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Google sign-in start failed:', error.message);
    return NextResponse.json({ error: 'Google sign-in is unavailable. Please try again or continue with email.' }, { status: 503 });
  }
}
