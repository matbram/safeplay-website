"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  ScrollText,
  User,
  Shield,
  Calendar,
  Filter,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/admin";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const actionColors: Record<string, string> = {
  view_user: "bg-muted text-muted-foreground",
  update_user: "bg-secondary/10 text-secondary",
  suspend_user: "bg-error/10 text-error",
  unsuspend_user: "bg-success/10 text-success",
  credit_adjustment: "bg-warning/10 text-warning",
  credit_refund: "bg-primary/10 text-primary",
  change_subscription: "bg-secondary/10 text-secondary",
  view_ticket: "bg-muted text-muted-foreground",
  update_ticket: "bg-secondary/10 text-secondary",
  reply_ticket: "bg-primary/10 text-primary",
  close_ticket: "bg-success/10 text-success",
  add_note: "bg-muted text-muted-foreground",
  add_flag: "bg-warning/10 text-warning",
  add_admin: "bg-success/10 text-success",
  remove_admin: "bg-error/10 text-error",
};

const targetTypeIcons: Record<string, typeof User> = {
  user: User,
  ticket: ScrollText,
  subscription: Shield,
};

export default function AdminAuditLogPage() {
  const router = useRouter();
  const { hasPermission } = useAdmin();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (actionFilter !== "all") params.set("action", actionFilter);
      if (targetFilter !== "all") params.set("target_type", targetFilter);

      const response = await fetch(`/api/admin/audit-log?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
        setAvailableActions(data.filters?.actions || []);
      }
    } catch (error) {
      console.error("Failed to fetch audit log:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, actionFilter, targetFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "created_at",
      header: "Time",
      sortable: true,
      className: "w-[180px]",
      render: (log) => (
        <div className="text-sm">
          <p className="font-medium">{formatDate(new Date(log.created_at))}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(log.created_at).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      key: "admin",
      header: "Admin",
      render: (log) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {log.profiles?.full_name?.charAt(0) ||
                log.profiles?.email?.charAt(0)?.toUpperCase() ||
                "A"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">
              {log.profiles?.full_name ||
                log.profiles?.email?.split("@")[0] ||
                "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground">
              {log.profiles?.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log) => (
        <Badge
          variant="outline"
          className={cn("capitalize", actionColors[log.action])}
        >
          {formatAction(log.action)}
        </Badge>
      ),
    },
    {
      key: "target",
      header: "Target",
      render: (log) => {
        const TargetIcon = targetTypeIcons[log.target_type] || ScrollText;
        return (
          <div className="flex items-center gap-2">
            <TargetIcon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm capitalize">{log.target_type}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {log.target_id.slice(0, 8)}...
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "details",
      header: "Details",
      render: (log) => {
        const details = log.details;
        if (!details || Object.keys(details).length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }

        // Show key details based on action type
        const detailText =
          details.reason ||
          details.email ||
          details.subject ||
          details.amount ||
          JSON.stringify(details).slice(0, 50);

        return (
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
            {String(detailText)}
          </span>
        );
      },
    },
    {
      key: "ip",
      header: "IP Address",
      className: "hidden lg:table-cell",
      render: (log) => (
        <span className="text-xs text-muted-foreground font-mono">
          {log.ip_address || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (log) => {
        if (log.target_type === "user") {
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/admin/users/${log.target_id}`)}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          );
        }
        if (log.target_type === "ticket") {
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/admin/tickets/${log.target_id}`)}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all administrative actions
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline">
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {availableActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {formatAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={targetFilter} onValueChange={setTargetFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Target Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {pagination.total.toLocaleString()} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={logs}
            columns={columns}
            keyField="id"
            loading={loading}
            searchable={false}
            pagination={true}
            pageSize={pagination.limit}
            emptyMessage="No audit log entries found"
          />

          {/* External Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
