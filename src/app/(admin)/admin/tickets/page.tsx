"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Ticket,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  MoreHorizontal,
  Eye,
  UserCheck,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatCard, StatCardGrid } from "@/components/admin";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const statusConfig: Record<
  string,
  { color: string; icon: typeof Clock; label: string }
> = {
  open: {
    color: "bg-warning/10 text-warning border-warning/20",
    icon: AlertCircle,
    label: "Open",
  },
  in_progress: {
    color: "bg-secondary/10 text-secondary border-secondary/20",
    icon: Clock,
    label: "In Progress",
  },
  resolved: {
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
    label: "Resolved",
  },
  closed: {
    color: "bg-muted text-muted-foreground border-border",
    icon: CheckCircle,
    label: "Closed",
  },
};

const priorityColors: Record<string, string> = {
  urgent: "bg-error text-white",
  high: "bg-warning text-white",
  normal: "bg-muted text-foreground",
  low: "bg-muted/50 text-muted-foreground",
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const { admin, hasPermission } = useAdmin();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (assignedFilter !== "all") params.set("assigned", assignedFilter);

      const response = await fetch(`/api/admin/tickets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTickets();
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchTickets]);

  // Stats
  const openCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  ).length;
  const urgentCount = tickets.filter(
    (t) => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed"
  ).length;
  const myTickets = tickets.filter((t) => t.assigned_to === admin?.id).length;

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: admin?.id }),
      });

      if (response.ok) {
        fetchTickets();
      }
    } catch (error) {
      console.error("Failed to assign ticket:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage customer support requests
          </p>
        </div>
        <Button onClick={fetchTickets} variant="outline">
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Open Tickets"
          value={openCount.toString()}
          icon={Ticket}
          description="Need attention"
          loading={loading}
          valueClassName={openCount > 0 ? "text-warning" : ""}
        />
        <StatCard
          title="Urgent"
          value={urgentCount.toString()}
          icon={AlertCircle}
          description="High priority"
          loading={loading}
          valueClassName={urgentCount > 0 ? "text-error" : ""}
        />
        <StatCard
          title="My Tickets"
          value={myTickets.toString()}
          icon={UserCheck}
          description="Assigned to you"
          loading={loading}
        />
        <StatCard
          title="Total"
          value={pagination.total.toString()}
          icon={Ticket}
          description="All tickets"
          loading={loading}
        />
      </StatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="me">Assigned to Me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>{tickets.length} tickets found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No tickets found
            </p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
                return (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="flex items-start justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors block"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          statusConfig[ticket.status]?.color || "bg-muted"
                        )}
                      >
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-xs",
                              priorityColors[ticket.priority]
                            )}
                          >
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {ticket.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            {ticket.profiles?.full_name || ticket.email}
                          </span>
                          <span>·</span>
                          <span>{formatDate(new Date(ticket.created_at))}</span>
                          {ticket.assigned_to === admin?.id && (
                            <>
                              <span>·</span>
                              <Badge variant="outline" className="text-xs">
                                Assigned to you
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          statusConfig[ticket.status]?.color
                        )}
                      >
                        {statusConfig[ticket.status]?.label || ticket.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.preventDefault()}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/tickets/${ticket.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Ticket
                            </Link>
                          </DropdownMenuItem>
                          {!ticket.assigned_to && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                handleAssignToMe(ticket.id);
                              }}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Assign to Me
                            </DropdownMenuItem>
                          )}
                          {ticket.user_id && (
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${ticket.user_id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View User
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} tickets
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
