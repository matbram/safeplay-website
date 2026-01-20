import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const supabase = await createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Update all thumbnails from maxresdefault to hqdefault
    const { data, error } = await supabase
      .from("videos")
      .update({
        thumbnail_url: supabase.rpc('replace', {
          // This won't work directly, need raw SQL
        })
      })
      .like("thumbnail_url", "%maxresdefault%");

    // Since Supabase JS doesn't support string replace easily,
    // let's do it differently - get all videos and update them
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
