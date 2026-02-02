import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";

/**
 * GET /api/admin/leads
 * Get all email leads (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const supabase = createServiceClient();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    const source = url.searchParams.get("source") || "";
    const sortBy = url.searchParams.get("sort") || "subscribed_at";
    const sortOrder = url.searchParams.get("order") || "desc";

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("email_leads")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.ilike("email", `%${search}%`);
    }
    if (source) {
      query = query.eq("source", source);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Get source breakdown for stats
    const { data: sourceStats } = await supabase
      .from("email_leads")
      .select("source")
      .then(result => {
        const sources: Record<string, number> = {};
        result.data?.forEach(lead => {
          sources[lead.source] = (sources[lead.source] || 0) + 1;
        });
        return { data: sources };
      });

    return NextResponse.json({
      leads: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      sourceStats,
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/leads
 * Delete a lead (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const body = await request.json();
    const { id, email } = body;

    if (!id && !email) {
      return NextResponse.json(
        { error: "Lead ID or email is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    let query = supabase.from("email_leads").delete();

    if (id) {
      query = query.eq("id", id);
    } else if (email) {
      query = query.eq("email", email);
    }

    const { error } = await query;

    if (error) throw error;

    // Log the action
    await logAdminAction(
      admin.id,
      "delete_lead",
      "email_leads",
      id || email,
      { email },
      request
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
