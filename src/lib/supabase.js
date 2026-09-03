import { createClient } from '@supabase/supabase-js';

let client;

/** Server-only database client. Do not expose the secret key to the browser. */
export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to the environment.');
  }

  client = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return client;
}

export function throwIfDbError(error) {
  if (error) throw new Error(error.message || 'Database request failed');
}
