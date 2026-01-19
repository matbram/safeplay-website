import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_tickets");
    if (!admin) return response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const assigned = searchParams.get("assigned") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("support_tickets")
      .select(
        `
        id,
        user_id,
        email,
        subject,
        message,
        status,
        priority,
        assigned_to,
        created_at,
        updated_at,
        resolved_at,
        profiles!support_tickets_user_id_fkey(full_name, email)
      `,
        { count: "exact" }
      );

    // Apply filters
    if (search) {
      query = query.or(
        `subject.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (assigned === "me") {
      query = query.eq("assigned_to", admin.id);
    } else if (assigned === "unassigned") {
      query = query.is("assigned_to", null);
    } else if (assigned && assigned !== "all") {
      query = query.eq("assigned_to", assigned);
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tickets, error, count } = await query;

    if (error) {
      console.error("Tickets fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin tickets error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
