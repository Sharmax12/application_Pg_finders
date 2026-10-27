import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY; // Backward compatibility for existing local deployments.

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env file."
  );
}

// This client is used for intentionally public listing reads. Supabase RLS must
// still govern access; a publishable key is not an authorization mechanism.
export const supabase = createClient(supabaseUrl, supabaseKey);

export function createSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient(supabaseUrl, supabaseKey, {
    accessToken: async () => (await getToken()) ?? null,
  });
}
