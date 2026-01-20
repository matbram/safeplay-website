"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Lock,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TicketDetail {
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
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

interface TicketMessage {
  id: string;
  message: string;
  sender_type: string;
  is_internal: boolean;
  created_at: string;
  sender_id: string | null;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "bg-warning/10 text-warning border-warning/20", label: "Open" },
  in_progress: {
    color: "bg-secondary/10 text-secondary border-secondary/20",
    label: "In Progress",
  },
  resolved: {
    color: "bg-success/10 text-success border-success/20",
    label: "Resolved",
  },
  closed: { color: "bg-muted text-muted-foreground border-border", label: "Closed" },
};

const priorityColors: Record<string, string> = {
  urgent: "bg-error text-white",
  high: "bg-warning text-white",
  normal: "bg-muted text-foreground",
  low: "bg-muted/50 text-muted-foreground",
};

export default function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { admin } = useAdmin();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/tickets/${resolvedParams.ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data.ticket);
        setMessages(data.messages);
      } else if (response.status === 404) {
        router.push("/admin/tickets");
      }
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [resolvedParams.ticketId]);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(
        `/api/admin/tickets/${resolvedParams.ticketId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: replyMessage,
            is_internal: isInternal,
          }),
        }
      );

      if (response.ok) {
        setReplyMessage("");
        fetchTicket();
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicket = async (
    field: string,
    value: string | null
  ) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/tickets/${resolvedParams.ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        fetchTicket();
      }
    } catch (error) {
      console.error("Failed to update ticket:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button asChild>
          <Link href="/admin/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/admin/tickets">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                  <CardDescription className="mt-1">
                    Opened {formatDate(new Date(ticket.created_at))} by{" "}
                    {ticket.profiles?.full_name || ticket.email}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("capitalize", priorityColors[ticket.priority])}
                  >
                    {ticket.priority}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(statusConfig[ticket.status]?.color)}
                  >
                    {statusConfig[ticket.status]?.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Original Message */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {ticket.profiles?.full_name?.charAt(0) ||
                        ticket.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {ticket.profiles?.full_name || ticket.email}
                    </p>
                    <p className="text-xs text-muted-foreground">Customer</p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap">{ticket.message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Messages Thread */}
          {messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-4 rounded-lg",
                      msg.sender_type === "admin"
                        ? msg.is_internal
                          ? "bg-warning/10 border border-warning/20"
                          : "bg-secondary/10 border border-secondary/20"
                        : "bg-muted/50 border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback
                            className={cn(
                              "text-xs",
                              msg.sender_type === "admin"
                                ? "bg-secondary text-white"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {msg.profiles?.full_name?.charAt(0) ||
                              (msg.sender_type === "admin" ? "A" : "U")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {msg.profiles?.full_name ||
                            (msg.sender_type === "admin" ? "Admin" : "Customer")}
                        </span>
                        {msg.is_internal && (
                          <Badge
                            variant="outline"
                            className="text-xs text-warning border-warning/20"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Internal
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(new Date(msg.created_at))}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={5}
                disabled={sending}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-border"
                  />
                  <Lock className="w-4 h-4 text-warning" />
                  Internal note (not visible to customer)
                </label>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleUpdateTicket("status", value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => handleUpdateTicket("priority", value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigned To</Label>
                {ticket.assigned_to === admin?.id ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <span className="text-sm">You</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateTicket("assigned_to", null)}
                      disabled={updating}
                    >
                      Unassign
                    </Button>
                  </div>
                ) : ticket.assigned_to ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <span className="text-sm">Another admin</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateTicket("assigned_to", admin?.id || null)}
                      disabled={updating}
                    >
                      Take Over
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpdateTicket("assigned_to", admin?.id || null)}
                    disabled={updating}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign to Me
                  </Button>
                )}
              </div>

              {ticket.status !== "resolved" && ticket.status !== "closed" && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full text-success border-success/50 hover:bg-success/10"
                    onClick={() => handleUpdateTicket("status", "resolved")}
                    disabled={updating}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {ticket.profiles?.full_name?.charAt(0) ||
                      ticket.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {ticket.profiles?.full_name || "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">{ticket.email}</p>
                </div>
              </div>

              {ticket.user_id && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/admin/users/${ticket.user_id}`}>
                    <User className="w-4 h-4 mr-2" />
                    View User Profile
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ticket ID</span>
                <span className="font-mono text-xs">
                  {ticket.id.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(new Date(ticket.created_at))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(new Date(ticket.updated_at))}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resolved</span>
                  <span>{formatDate(new Date(ticket.resolved_at))}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
