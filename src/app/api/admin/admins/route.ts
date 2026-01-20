import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, AdminActions } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_admins");
    if (!admin) return response;

    const supabase = createServiceClient();

    const { data: admins, error } = await supabase
      .from("admin_roles")
      .select(
        `
        user_id,
        role,
        permissions,
        created_at,
        profiles!admin_roles_user_id_fkey(email, display_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admins fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch admins" },
        { status: 500 }
      );
    }

    return NextResponse.json({ admins: admins || [] });
  } catch (error) {
    console.error("Admin admins error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_admins");
    if (!admin) return response;

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    const validRoles = ["super_admin", "admin", "support"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Only super_admins can create super_admins
    if (role === "super_admin" && admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can create super admins" },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    // Check if already an admin
    const { data: existingAdmin } = await supabase
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", profile.id)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "User is already an admin" },
        { status: 400 }
      );
    }

    // Create admin role
    const { data: newAdmin, error: createError } = await supabase
      .from("admin_roles")
      .insert({
        user_id: profile.id,
        role,
        permissions: {},
        created_by: admin.id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: "Failed to create admin" },
        { status: 500 }
      );
    }

    // Log action
    await logAdminAction(
      admin.id,
      AdminActions.ADD_ADMIN,
      "user",
      profile.id,
      { email, role },
      request
    );

    return NextResponse.json({
      admin: newAdmin,
      message: "Admin added successfully",
    });
  } catch (error) {
    console.error("Admin create error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
