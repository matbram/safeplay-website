import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin(request, "view_audit_log");
    if (!admin) return response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const adminId = searchParams.get("admin_id") || "";
    const action = searchParams.get("action") || "";
    const targetType = searchParams.get("target_type") || "";
    const targetId = searchParams.get("target_id") || "";
    const startDate = searchParams.get("start_date") || "";
    const endDate = searchParams.get("end_date") || "";

    const offset = (page - 1) * limit;

    const supabase = createServiceClient();

    // Build query
    let query = supabase
      .from("admin_audit_log")
      .select(
        `
        id,
        action,
        target_type,
        target_id,
        details,
        ip_address,
        user_agent,
        created_at,
        admin_id,
        profiles!admin_audit_log_admin_id_fkey(display_name, email)
      `,
        { count: "exact" }
      );

    // Apply filters
    if (adminId) {
      query = query.eq("admin_id", adminId);
    }

    if (action) {
      query = query.eq("action", action);
    }

    if (targetType) {
      query = query.eq("target_type", targetType);
    }

    if (targetId) {
      query = query.eq("target_id", targetId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    // Apply sorting and pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("Audit log fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit log" },
        { status: 500 }
      );
    }

    // Get unique actions for filtering
    const { data: actions } = await supabase
      .from("admin_audit_log")
      .select("action")
      .limit(100);

    const uniqueActions = [...new Set(actions?.map((a) => a.action) || [])];

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: {
        actions: uniqueActions,
      },
    });
  } catch (error) {
    console.error("Admin audit log error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
