import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, AdminActions } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_tickets");
    if (!admin) return response;

    const { ticketId } = await params;
    const supabase = createServiceClient();

    // Get ticket with messages
    const [ticketResult, messagesResult] = await Promise.all([
      supabase
        .from("support_tickets")
        .select(
          `
          *,
          profiles!support_tickets_user_id_fkey(id, display_name, email)
        `
        )
        .eq("id", ticketId)
        .single(),

      supabase
        .from("ticket_messages")
        .select(
          `
          id,
          message,
          sender_type,
          is_internal,
          created_at,
          sender_id,
          profiles!ticket_messages_sender_id_fkey(display_name, email)
        `
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
    ]);

    if (ticketResult.error) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Log view
    await logAdminAction(
      admin.id,
      AdminActions.VIEW_TICKET,
      "ticket",
      ticketId,
      { subject: ticketResult.data.subject },
      request
    );

    return NextResponse.json({
      ticket: ticketResult.data,
      messages: messagesResult.data || [],
    });
  } catch (error) {
    console.error("Admin ticket detail error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_tickets");
    if (!admin) return response;

    const { ticketId } = await params;
    const body = await request.json();

    const allowedFields = ["status", "priority", "assigned_to"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Validate status
    if (updates.status) {
      const validStatuses = ["open", "in_progress", "resolved", "closed"];
      if (!validStatuses.includes(updates.status as string)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }

      // Set resolved_at if resolving
      if (updates.status === "resolved" || updates.status === "closed") {
        updates.resolved_at = new Date().toISOString();
      }
    }

    // Validate priority
    if (updates.priority) {
      const validPriorities = ["low", "normal", "high", "urgent"];
      if (!validPriorities.includes(updates.priority as string)) {
        return NextResponse.json(
          { error: "Invalid priority" },
          { status: 400 }
        );
      }
    }

    updates.updated_at = new Date().toISOString();

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update ticket" },
        { status: 500 }
      );
    }

    // Log action
    await logAdminAction(
      admin.id,
      AdminActions.UPDATE_TICKET,
      "ticket",
      ticketId,
      { updates },
      request
    );

    return NextResponse.json({
      ticket: data,
      message: "Ticket updated successfully",
    });
  } catch (error) {
    console.error("Admin ticket update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
