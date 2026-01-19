import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return cached client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if env vars are available (they may not be during static build)
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build that will be replaced on hydration
    // This prevents build errors while still working correctly at runtime
    if (typeof window === "undefined") {
      return null as unknown as ReturnType<typeof createBrowserClient>;
    }
    throw new Error("Supabase environment variables are not configured");
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}
