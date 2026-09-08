import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const STORAGE_KEY = 'scrum-google';
const VERIFIER_KEY = `${STORAGE_KEY}-code-verifier`;

// Only the short-lived PKCE verifier is stored; Scrum Tracker owns the app session.
export async function createGoogleAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Google sign-in is not configured. Please contact your workspace administrator.');
  const cookieStore = await cookies();
  return createClient(url, key, {
    auth: {
      flowType: 'pkce',
      storageKey: STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (name) => name === VERIFIER_KEY ? cookieStore.get(name)?.value ?? null : null,
        setItem(name, value) {
          if (name === VERIFIER_KEY) cookieStore.set(name, value, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', path: '/', maxAge: 600
          });
        },
        removeItem(name) {
          if (name === VERIFIER_KEY) cookieStore.delete(name);
        }
      }
    }
  });
}

export function isSameOrigin(request) {
  try {
    const origin = request.headers.get('origin');
    if (!origin || origin === 'null') return false;
    const browserUrl = new URL(origin);
    const serverUrl = new URL(request.url);
    // Next can normalize request.url to localhost while the browser uses 127.0.0.1.
    // Host retains the requested authority; never trust Origin by itself.
    const host = request.headers.get('host') || serverUrl.host;
    return origin === browserUrl.origin
      && browserUrl.host === host
      && browserUrl.protocol === serverUrl.protocol;
  } catch {
    return false;
  }
}
