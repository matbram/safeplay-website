import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Default permissions for each role
const DEFAULT_PERMISSIONS = {
  super_admin: {
    manage_users: true,
    manage_credits: true,
    manage_subscriptions: true,
    manage_tickets: true,
    manage_admins: true,
    view_audit_log: true,
    export_data: true,
    suspend_accounts: true,
  },
  admin: {
    manage_users: true,
    manage_credits: true,
    manage_subscriptions: true,
    manage_tickets: true,
    manage_admins: false,
    view_audit_log: true,
    export_data: true,
    suspend_accounts: true,
  },
  support: {
    manage_users: true,
    manage_credits: false,
    manage_subscriptions: false,
    manage_tickets: true,
    manage_admins: false,
    view_audit_log: false,
    export_data: false,
    suspend_accounts: false,
  },
} as const;

type AdminRole = keyof typeof DEFAULT_PERMISSIONS;

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Use service client to query admin_roles (bypasses RLS)
    const serviceClient = createServiceClient();

    const { data: adminRole, error: roleError } = await serviceClient
      .from("admin_roles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (roleError || !adminRole) {
      return NextResponse.json(
        { error: "Not authorized as admin" },
        { status: 403 }
      );
    }

    // Get profile for name
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Merge permissions
    const role = adminRole.role as AdminRole;
    const defaultPerms = DEFAULT_PERMISSIONS[role] || {};
    const customPerms = adminRole.permissions || {};
    const mergedPermissions = { ...defaultPerms, ...customPerms };

    return NextResponse.json({
      admin: {
        id: user.id,
        email: user.email,
        role,
        permissions: mergedPermissions,
        full_name: profile?.full_name || null,
      },
    });
  } catch (error) {
    console.error("Admin me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}
