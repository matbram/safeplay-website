import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    // Check admin access using the proper admin auth
    const { admin, response } = await requireAdmin(request);
    if (!admin) {
      return response;
    }

    const supabase = await createServiceClient();

    // Get all videos with maxresdefault thumbnails
    const { data: videos, error: fetchError } = await supabase
      .from("videos")
      .select("id, youtube_id, thumbnail_url")
      .like("thumbnail_url", "%maxresdefault%");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let updated = 0;
    for (const video of videos || []) {
      const newUrl = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
      const { error: updateError } = await supabase
        .from("videos")
        .update({ thumbnail_url: newUrl })
        .eq("id", video.id);

      if (!updateError) {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} video thumbnails`,
      total_found: videos?.length || 0,
    });
  } catch (error) {
    console.error("Fix thumbnails error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
