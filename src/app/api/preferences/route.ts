import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user preferences
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    // Get notification preferences
    const { data: notifications } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      preferences: preferences || {
        default_filter_type: "mute",
        sensitivity_level: "moderate",
        custom_words: [],
        auto_save_history: true,
        data_retention_days: 90,
        share_history_with_family: false,
      },
      notifications: notifications || {
        billing_alerts: true,
        usage_alerts: true,
        credit_low_threshold: 80,
        feature_updates: true,
        marketing_emails: false,
      },
    });
  } catch (error) {
    console.error("Preferences fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // Separate preferences and notifications
    const prefFields = ["default_filter_type", "sensitivity_level", "custom_words", "auto_save_history", "data_retention_days", "share_history_with_family"];
    const notifFields = ["billing_alerts", "usage_alerts", "credit_low_threshold", "feature_updates", "marketing_emails"];

    const prefUpdates: Record<string, unknown> = {};
    const notifUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (prefFields.includes(key)) {
        prefUpdates[key] = value;
      } else if (notifFields.includes(key)) {
        notifUpdates[key] = value;
      }
    }

    // Update preferences if any
    if (Object.keys(prefUpdates).length > 0) {
      prefUpdates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          ...prefUpdates,
        });

      if (error) {
        return NextResponse.json(
          { error: "Failed to update preferences" },
          { status: 500 }
        );
      }
    }

    // Update notifications if any
    if (Object.keys(notifUpdates).length > 0) {
      notifUpdates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...notifUpdates,
        });

      if (error) {
        return NextResponse.json(
          { error: "Failed to update notification preferences" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
