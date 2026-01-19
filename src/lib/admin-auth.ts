import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export type AdminRole = "super_admin" | "admin" | "support";

export interface AdminPermissions {
  manage_users?: boolean;
  manage_credits?: boolean;
  manage_subscriptions?: boolean;
  manage_tickets?: boolean;
  manage_admins?: boolean;
  view_audit_log?: boolean;
  export_data?: boolean;
  suspend_accounts?: boolean;
}

export interface AdminUser {
  id: string;
  email?: string;
  role: AdminRole;
  permissions: AdminPermissions;
}

export interface AdminAuthResult {
  admin: AdminUser | null;
  error: string | null;
}

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
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
};

/**
 * Authenticate an admin request
 * Checks if the user is logged in and has admin privileges
 */
export async function authenticateAdmin(
  request?: NextRequest
): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { admin: null, error: "Not authenticated" };
    }

    // Check if user has admin role
    const { data: adminRole, error: roleError } = await supabase
      .from("admin_roles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (roleError || !adminRole) {
      return { admin: null, error: "Not authorized as admin" };
    }

    // Merge default permissions with any custom permissions
    const role = adminRole.role as AdminRole;
    const defaultPerms = DEFAULT_PERMISSIONS[role] || {};
    const customPerms = (adminRole.permissions as AdminPermissions) || {};
    const mergedPermissions = { ...defaultPerms, ...customPerms };

    return {
      admin: {
        id: user.id,
        email: user.email,
        role,
        permissions: mergedPermissions,
      },
      error: null,
    };
  } catch (error) {
    console.error("Admin authentication error:", error);
    return { admin: null, error: "Authentication failed" };
  }
}

/**
 * Check if admin has a specific permission
 */
export function hasPermission(
  admin: AdminUser | null,
  permission: keyof AdminPermissions
): boolean {
  if (!admin) return false;

  // Super admins have all permissions
  if (admin.role === "super_admin") return true;

  return admin.permissions[permission] === true;
}

/**
 * Require admin authentication - returns 401/403 if not authorized
 */
export async function requireAdmin(
  request?: NextRequest,
  requiredPermission?: keyof AdminPermissions
): Promise<
  | { admin: AdminUser; response: null }
  | { admin: null; response: NextResponse }
> {
  const { admin, error } = await authenticateAdmin(request);

  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json(
        { error: error || "Unauthorized" },
        { status: error === "Not authenticated" ? 401 : 403 }
      ),
    };
  }

  if (requiredPermission && !hasPermission(admin, requiredPermission)) {
    return {
      admin: null,
      response: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { admin, response: null };
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
  request?: NextRequest
): Promise<void> {
  try {
    const supabase = await createClient();

    const ipAddress = request?.headers.get("x-forwarded-for") ||
                      request?.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = request?.headers.get("user-agent") || "unknown";

    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

/**
 * Admin action types for audit logging
 */
export const AdminActions = {
  // User management
  VIEW_USER: "view_user",
  UPDATE_USER: "update_user",
  SUSPEND_USER: "suspend_user",
  UNSUSPEND_USER: "unsuspend_user",
  DELETE_USER: "delete_user",

  // Credit management
  CREDIT_ADJUSTMENT: "credit_adjustment",
  CREDIT_REFUND: "credit_refund",

  // Subscription management
  CHANGE_SUBSCRIPTION: "change_subscription",
  CANCEL_SUBSCRIPTION: "cancel_subscription",
  EXTEND_TRIAL: "extend_trial",

  // Support tickets
  VIEW_TICKET: "view_ticket",
  UPDATE_TICKET: "update_ticket",
  ASSIGN_TICKET: "assign_ticket",
  REPLY_TICKET: "reply_ticket",
  CLOSE_TICKET: "close_ticket",

  // Admin management
  ADD_ADMIN: "add_admin",
  REMOVE_ADMIN: "remove_admin",
  UPDATE_ADMIN_ROLE: "update_admin_role",

  // Notes and flags
  ADD_NOTE: "add_note",
  ADD_FLAG: "add_flag",
  RESOLVE_FLAG: "resolve_flag",

  // Data export
  EXPORT_DATA: "export_data",
} as const;

export type AdminAction = (typeof AdminActions)[keyof typeof AdminActions];
