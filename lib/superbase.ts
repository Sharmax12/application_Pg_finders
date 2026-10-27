import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig(): { url: string; key: string } {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env file."
    );
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();

// This client is used for intentionally public listing reads. Supabase RLS must
// still govern access; a publishable key is not an authorization mechanism.
export const supabase = createClient(supabaseUrl, supabaseKey);

export function createSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient(supabaseUrl, supabaseKey, {
    accessToken: async () => (await getToken()) ?? null,
  });
}
