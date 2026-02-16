import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export interface VideoCategory {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface PlayerSettings {
  premute_padding_ms: number;
  postmute_padding_ms: number;
  merge_threshold_ms: number;
  default_filter_mode: "mute" | "bleep";
  bleep_frequency: number;
  bleep_volume: number;
}

export interface LaunchModeSettings {
  is_pre_launch: boolean;
  allow_signups: boolean;
  video_categories?: VideoCategory[] | null;
  player_settings?: PlayerSettings | null;
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
      .select("key, value")
      .in("key", ["launch_mode", "launch_video_categories", "launch_player_settings"]);

    if (error || !data) {
      // Default to pre-launch mode if setting doesn't exist
      return { is_pre_launch: true, allow_signups: false };
    }

    const settingsMap: Record<string, unknown> = {};
    data.forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    const launchMode = settingsMap.launch_mode as { is_pre_launch?: boolean; allow_signups?: boolean } | undefined;
    const videoCategories = settingsMap.launch_video_categories as VideoCategory[] | undefined;
    const playerSettings = settingsMap.launch_player_settings as PlayerSettings | undefined;

    return {
      is_pre_launch: launchMode?.is_pre_launch ?? true,
      allow_signups: launchMode?.allow_signups ?? false,
      video_categories: videoCategories ?? null,
      player_settings: playerSettings ?? null,
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
