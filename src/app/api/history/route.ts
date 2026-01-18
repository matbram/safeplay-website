import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || "";
    const filterType = searchParams.get("filterType") || "";

    // Build query
    let query = supabase
      .from("filter_history")
      .select("*, videos(*)", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filterType && filterType !== "all") {
      query = query.eq("filter_type", filterType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: history, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 }
      );
    }

    // If search term provided, filter in memory (for video titles)
    let filteredHistory = history;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredHistory = history?.filter(
        (item) =>
          item.videos?.title?.toLowerCase().includes(searchLower) ||
          item.videos?.channel_name?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate stats
    const stats = {
      totalVideos: count || 0,
      totalMinutes: history?.reduce((sum, item) => sum + (item.videos?.duration_seconds || 0), 0) / 60 || 0,
      totalCredits: history?.reduce((sum, item) => sum + item.credits_used, 0) || 0,
    };

    return NextResponse.json({
      history: filteredHistory,
      stats,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No history IDs provided" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("filter_history")
      .delete()
      .eq("user_id", user.id)
      .in("id", ids);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete history entries" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Deleted ${ids.length} history entries`,
    });
  } catch (error) {
    console.error("History delete error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
