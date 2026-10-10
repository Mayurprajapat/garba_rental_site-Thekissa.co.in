import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  client = createClient(url!, anon!);
} else {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not found — running on local PRODUCTS data. Add them in .env for backend mode.'
  );
}

export const supabase = client;
