import { createClient } from '@supabase/supabase-js';

let client;

const DEFAULT_URL = 'https://oemyolebtzxpvhtfaxxi.supabase.co';
const DEFAULT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbXlvbGVidHp4cHZodGZheHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODUxMzEzMywiZXhwIjoyMTA0MDg5MTMzfQ.uDZLHrnnxphZXWPmXdmMIMphil_h-c2VdkYd2GSGilM';

/** Server-only database client. Do not expose the secret key to the browser. */
export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SECRET;

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
