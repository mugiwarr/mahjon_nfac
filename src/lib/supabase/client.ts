import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;

const getSupabaseBrowserKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () =>
  Boolean(getSupabaseUrl() && getSupabaseBrowserKey());

export const getSupabaseBrowserClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(getSupabaseUrl() as string, getSupabaseBrowserKey() as string);
  }

  return browserClient;
};
