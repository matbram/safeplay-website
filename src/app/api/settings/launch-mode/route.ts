import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface LaunchModeSettings {
  is_pre_launch: boolean;
  allow_signups: boolean;
}

/**
 * GET /api/settings/launch-mode
 * Public endpoint to check if site is in pre-launch mode
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "launch_mode")
      .single();

    if (error) {
      // If no setting exists, default to pre-launch mode
      if (error.code === "PGRST116") {
        return NextResponse.json({
          is_pre_launch: true,
          allow_signups: false,
        });
      }
      throw error;
    }

    const settings = data.value as LaunchModeSettings;

    return NextResponse.json({
      is_pre_launch: settings.is_pre_launch ?? true,
      allow_signups: settings.allow_signups ?? false,
    });
  } catch (error) {
    console.error("Failed to fetch launch mode:", error);
    // Default to pre-launch mode on error for safety
    return NextResponse.json({
      is_pre_launch: true,
      allow_signups: false,
    });
  }
}
