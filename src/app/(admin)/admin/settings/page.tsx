"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  UserPlus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/admin";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AdminUser {
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

const roleColors: Record<string, string> = {
  super_admin: "bg-primary text-white",
  admin: "bg-secondary text-white",
  support: "bg-muted text-foreground",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support Agent",
};

const roleDescriptions: Record<string, string> = {
  super_admin: "Full access to all features and admin management",
  admin: "Full access except admin management",
  support: "Limited access - tickets and user viewing only",
};

export default function AdminSettingsPage() {
  const { admin, hasPermission } = useAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Add admin form state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("support");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/admins");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission("manage_admins")) {
      fetchAdmins();
    }
  }, [hasPermission]);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setAddError("Email is required");
      return;
    }

    setAddLoading(true);
    setAddError("");

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail,
          role: newAdminRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowAddModal(false);
        setNewAdminEmail("");
        setNewAdminRole("support");
        fetchAdmins();
      } else {
        setAddError(data.error || "Failed to add admin");
      }
    } catch (error) {
      setAddError("An error occurred");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.user_id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowRemoveModal(false);
        setSelectedAdmin(null);
        fetchAdmins();
      }
    } catch (error) {
      console.error("Failed to remove admin:", error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/admins/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchAdmins();
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  if (!hasPermission("manage_admins")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-warning" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access admin settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">
            Manage admin users and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchAdmins} variant="outline">
            <RefreshCw
              className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="grid gap-4 md:grid-cols-3">
        {["super_admin", "admin", "support"].map((role) => (
          <Card key={role} className={cn(role === "super_admin" && "border-primary")}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge className={roleColors[role]}>{roleLabels[role]}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {roleDescriptions[role]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>{admins.length} admin users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No admin users found
            </p>
          ) : (
            <div className="space-y-3">
              {admins.map((adminUser) => (
                <div
                  key={adminUser.user_id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {adminUser.profiles.full_name ||
                          adminUser.profiles.email.split("@")[0]}
                        {adminUser.user_id === admin?.id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {adminUser.profiles.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">
                        Added {formatDate(new Date(adminUser.created_at))}
                      </p>
                    </div>

                    {admin?.role === "super_admin" &&
                    adminUser.user_id !== admin?.id ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={adminUser.role}
                          onValueChange={(value) =>
                            handleUpdateRole(adminUser.user_id, value)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">
                              Super Admin
                            </SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-error hover:text-error hover:bg-error/10"
                          onClick={() => {
                            setSelectedAdmin(adminUser);
                            setShowRemoveModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Badge className={roleColors[adminUser.role]}>
                        {roleLabels[adminUser.role]}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Grant admin access to an existing user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User Email</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The user must already have an account
              </p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Support Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {admin?.role === "super_admin" && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleDescriptions[newAdminRole]}
              </p>
            </div>
            {addError && (
              <p className="text-sm text-error">{addError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={addLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={addLoading}>
              {addLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Modal */}
      <ConfirmModal
        open={showRemoveModal}
        onOpenChange={setShowRemoveModal}
        title="Remove Admin Access"
        description={`Are you sure you want to remove admin access from ${selectedAdmin?.profiles.full_name || selectedAdmin?.profiles.email}? They will no longer be able to access the admin panel.`}
        variant="danger"
        confirmText="Remove Admin"
        onConfirm={handleRemoveAdmin}
      />
    </div>
  );
}
