import { createServerClient } from "@supabase/ssr";

const DEFAULT_URL = 'https://oemyolebtzxpvhtfaxxi.supabase.co';
const DEFAULT_KEY = 'sb_publishable_8ag3t3vyH4tS150NmuDe6A_HEwOxx-Q';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_KEY;

export const createClient = (cookieStore) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored from Server Component
          }
        },
      },
    }
  );
};
