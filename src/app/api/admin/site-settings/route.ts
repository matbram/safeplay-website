import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, AdminActions } from "@/lib/admin-auth";

interface LaunchModeSettings {
  is_pre_launch: boolean;
  allow_signups: boolean;
}

/**
 * GET /api/admin/site-settings
 * Get all site settings (admin only)
 */
export async function GET() {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("key");

    if (error) throw error;

    // Transform to key-value object
    const settings: Record<string, unknown> = {};
    data?.forEach((row) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/site-settings
 * Update site settings (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Upsert the setting
    const { data, error } = await supabase
      .from("site_settings")
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: admin.id,
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await logAdminAction(
      admin.id,
      "update_site_setting",
      "site_settings",
      key,
      { old_value: null, new_value: value },
      request
    );

    return NextResponse.json({ success: true, setting: data });
  } catch (error) {
    console.error("Failed to update site settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
