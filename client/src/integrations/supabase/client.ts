import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const errorMessage =
  "Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env when enabling the PalWakf bridge.";

export const isSupabaseEnabled = Boolean(url && anonKey);

let _supabase: SupabaseClient | null = null;

function createConfiguredClient() {
  if (!isSupabaseEnabled) {
    return new Proxy(
      {},
      {
        get() {
          throw new Error(errorMessage);
        },
      }
    ) as any;
  }

  return createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase = (_supabase ??= createConfiguredClient());

export default supabase;
