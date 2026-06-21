import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/* =================================================================
   RollWise — Supabase client
   -----------------------------------------------------------------
   Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the env
   (see .env.local). Only the anon/public key is used in the browser;
   the service-role key must NEVER be placed in this app.
   ================================================================= */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both env vars are present and the client is usable. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The Supabase client, or null if env vars are missing. Prefer
 * `getSupabase()` in services so you get a clear error instead of a
 * null-pointer when configuration is absent.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Returns the client, throwing a clear error if Supabase isn't configured. */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, then restart the dev server.',
    );
  }
  return supabase;
}
