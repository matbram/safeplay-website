"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

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

export interface AdminUser {
  id: string;
  email?: string;
  role: AdminRole;
  permissions: AdminPermissions;
  full_name?: string;
}

interface AdminContextType {
  admin: AdminUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the API endpoint instead of querying directly
      // This uses the service role client on the server to bypass RLS
      const response = await fetch("/api/admin/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json();
        setAdmin(null);
        setError(data.error || "Not authorized");
        return;
      }

      const data = await response.json();
      setAdmin(data.admin);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError("Failed to fetch admin data");
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: keyof AdminPermissions): boolean => {
      if (!admin) return false;
      if (admin.role === "super_admin") return true;
      return admin.permissions[permission] === true;
    },
    [admin]
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAdmin(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    fetchAdminData();

    // Listen for auth state changes
    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT") {
        setAdmin(null);
      } else if (event === "SIGNED_IN") {
        fetchAdminData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAdminData]);

  return (
    <AdminContext.Provider
      value={{
        admin,
        loading,
        error,
        refetch: fetchAdminData,
        hasPermission,
        signOut,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
