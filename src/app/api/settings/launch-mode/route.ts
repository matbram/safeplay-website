import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface LaunchModeSettings {
  is_pre_launch: boolean;
  allow_signups: boolean;
}

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

/**
 * GET /api/settings/launch-mode
 * Public endpoint to check launch status, video categories, and player settings
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["launch_mode", "launch_video_categories", "launch_player_settings"]);

    if (error) throw error;

    // Build settings map from results
    const settingsMap: Record<string, unknown> = {};
    data?.forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    const launchMode = settingsMap.launch_mode as LaunchModeSettings | undefined;
    const videoCategories = settingsMap.launch_video_categories as VideoCategory[] | undefined;
    const playerSettings = settingsMap.launch_player_settings as PlayerSettings | undefined;

    return NextResponse.json({
      is_pre_launch: launchMode?.is_pre_launch ?? true,
      allow_signups: launchMode?.allow_signups ?? false,
      video_categories: videoCategories ?? null,
      player_settings: playerSettings ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch launch mode:", error);
    // Default to pre-launch mode on error for safety
    return NextResponse.json({
      is_pre_launch: true,
      allow_signups: false,
      video_categories: null,
      player_settings: null,
    });
  }
}
