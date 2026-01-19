import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, AdminActions } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_admins");
    if (!admin) return response;

    // Only super_admins can change roles
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can change roles" },
        { status: 403 }
      );
    }

    const { adminId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const validRoles = ["super_admin", "admin", "support"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent self-demotion
    if (adminId === admin.id && role !== "super_admin") {
      return NextResponse.json(
        { error: "Cannot demote yourself" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("admin_roles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("user_id", adminId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update admin role" },
        { status: 500 }
      );
    }

    // Log action
    await logAdminAction(
      admin.id,
      AdminActions.UPDATE_ADMIN_ROLE,
      "user",
      adminId,
      { new_role: role },
      request
    );

    return NextResponse.json({
      admin: data,
      message: "Admin role updated successfully",
    });
  } catch (error) {
    console.error("Admin update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_admins");
    if (!admin) return response;

    // Only super_admins can remove admins
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can remove admins" },
        { status: 403 }
      );
    }

    const { adminId } = await params;

    // Prevent self-removal
    if (adminId === admin.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get admin info for logging
    const { data: targetAdmin } = await supabase
      .from("admin_roles")
      .select("*, profiles!admin_roles_user_id_fkey(email)")
      .eq("user_id", adminId)
      .single();

    const { error } = await supabase
      .from("admin_roles")
      .delete()
      .eq("user_id", adminId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove admin" },
        { status: 500 }
      );
    }

    // Log action
    await logAdminAction(
      admin.id,
      AdminActions.REMOVE_ADMIN,
      "user",
      adminId,
      { email: (targetAdmin?.profiles as { email: string })?.email, previous_role: targetAdmin?.role },
      request
    );

    return NextResponse.json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
