import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, AdminActions } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_users");
    if (!admin) return response;

    const { userId } = await params;
    const supabase = createServiceClient();

    const { data: notes, error } = await supabase
      .from("admin_notes")
      .select(
        `
        id,
        note,
        is_pinned,
        created_at,
        updated_at,
        admin_id,
        profiles!admin_notes_admin_id_fkey(full_name, email)
      `
      )
      .eq("user_id", userId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Admin notes fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_users");
    if (!admin) return response;

    const { userId } = await params;
    const body = await request.json();

    const { note, is_pinned = false } = body;

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create note
    const { data: newNote, error } = await supabase
      .from("admin_notes")
      .insert({
        user_id: userId,
        admin_id: admin.id,
        note: note.trim(),
        is_pinned,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create note" },
        { status: 500 }
      );
    }

    // Log action
    await logAdminAction(
      admin.id,
      AdminActions.ADD_NOTE,
      "user",
      userId,
      { note_id: newNote.id, is_pinned },
      request
    );

    return NextResponse.json({
      note: newNote,
      message: "Note added successfully",
    });
  } catch (error) {
    console.error("Admin note create error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
