import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export interface LaunchModeSettings {
  is_pre_launch: boolean;
  allow_signups: boolean;
}

/**
 * Check if the site is in pre-launch mode
 * Uses service role to bypass RLS
 */
export async function getLaunchMode(): Promise<LaunchModeSettings> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Default to pre-launch if not configured
  if (!supabaseUrl || !serviceRoleKey) {
    return { is_pre_launch: true, allow_signups: false };
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "launch_mode")
      .single();

    if (error || !data) {
      // Default to pre-launch mode if setting doesn't exist
      return { is_pre_launch: true, allow_signups: false };
    }

    const settings = data.value as LaunchModeSettings;
    return {
      is_pre_launch: settings.is_pre_launch ?? true,
      allow_signups: settings.allow_signups ?? false,
    };
  } catch (error) {
    console.error("Failed to fetch launch mode:", error);
    return { is_pre_launch: true, allow_signups: false };
  }
}

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !userId) {
    return false;
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}
