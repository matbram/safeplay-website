import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, AdminActions } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_tickets");
    if (!admin) return response;

    const { ticketId } = await params;
    const body = await request.json();

    const { message, is_internal = false } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("id, status")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: admin.id,
        sender_type: "admin",
        message: message.trim(),
        is_internal,
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json(
        { error: "Failed to send reply" },
        { status: 500 }
      );
    }

    // Update ticket status to in_progress if it was open
    if (ticket.status === "open") {
      await supabase
        .from("support_tickets")
        .update({
          status: "in_progress",
          assigned_to: admin.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);
    } else {
      // Just update the timestamp
      await supabase
        .from("support_tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", ticketId);
    }

    // Log action
    await logAdminAction(
      admin.id,
      AdminActions.REPLY_TICKET,
      "ticket",
      ticketId,
      { is_internal, message_id: newMessage.id },
      request
    );

    return NextResponse.json({
      message: newMessage,
      success: true,
    });
  } catch (error) {
    console.error("Admin ticket reply error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
