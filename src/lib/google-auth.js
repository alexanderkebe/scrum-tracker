'use client';

import { createClient } from '@supabase/supabase-js';

export async function startGoogleSignIn() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Google sign-in is not configured yet. Please use email and password.');
  }

  const supabase = createClient(url, publishableKey, {
    auth: { flowType: 'implicit', persistSession: false, detectSessionInUrl: false }
  });
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
  if (error) throw error;
}
