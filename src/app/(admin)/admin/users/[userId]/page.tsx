"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  CreditCard,
  Coins,
  Ticket,
  ScrollText,
  AlertTriangle,
  Plus,
  Minus,
  RefreshCw,
  StickyNote,
  Flag,
  History,
  MoreVertical,
  Send,
  Pin,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UserDetail {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  };
  subscription: {
    id: string;
    plan_id: string;
    status: string;
    stripe_customer_id: string | null;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    plans: {
      id: string;
      name: string;
      price_cents: number;
      credits_per_month: number;
    };
  } | null;
  credits: {
    available_credits: number;
    used_this_period: number;
    rollover_credits: number;
    topup_credits: number;
    period_start: string;
    period_end: string;
  } | null;
  transactions: {
    id: string;
    amount: number;
    balance_after: number;
    type: string;
    description: string;
    created_at: string;
  }[];
  tickets: {
    id: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
  }[];
  notes: {
    id: string;
    note: string;
    is_pinned: boolean;
    created_at: string;
    admin_id: string;
    profiles: { full_name: string; email: string } | null;
  }[];
  flags: {
    id: string;
    flag_type: string;
    reason: string;
    expires_at: string | null;
    created_at: string;
    resolved_at: string | null;
  }[];
  filterHistory: {
    id: string;
    filter_type: string;
    credits_used: number;
    created_at: string;
    videos: { youtube_id: string; title: string } | null;
  }[];
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  individual: "bg-primary/10 text-primary",
  family: "bg-secondary/10 text-secondary",
  organization: "bg-success/10 text-success",
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  canceled: "bg-error/10 text-error border-error/20",
  past_due: "bg-warning/10 text-warning border-warning/20",
  paused: "bg-muted text-muted-foreground border-border",
};

const ticketStatusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning",
  in_progress: "bg-secondary/10 text-secondary",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, hasPermission } = useAdmin();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );

  // Credit adjustment state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditType, setCreditType] = useState("adjustment");
  const [creditLoading, setCreditLoading] = useState(false);

  // Note state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notePinned, setNotePinned] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${resolvedParams.userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 404) {
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [resolvedParams.userId]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleCreditAdjustment = async () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount" });
      return;
    }
    if (!creditReason.trim()) {
      setFeedback({ type: "error", message: "Please provide a reason" });
      return;
    }

    setCreditLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/${resolvedParams.userId}/credits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            reason: creditReason,
            type: creditType,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFeedback({
          type: "success",
          message: `Successfully ${amount >= 0 ? "added" : "removed"} ${Math.abs(amount)} credits`,
        });
        setShowCreditModal(false);
        setCreditAmount("");
        setCreditReason("");
        fetchUser();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to adjust credits" });
      }
    } catch (error) {
      setFeedback({ type: "error", message: "An error occurred" });
    } finally {
      setCreditLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      setFeedback({ type: "error", message: "Please enter a note" });
      return;
    }

    setNoteLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/${resolvedParams.userId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note: noteText,
            is_pinned: notePinned,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFeedback({ type: "success", message: "Note added successfully" });
        setShowNoteModal(false);
        setNoteText("");
        setNotePinned(false);
        fetchUser();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to add note" });
      }
    } catch (error) {
      setFeedback({ type: "error", message: "An error occurred" });
    } finally {
      setNoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button asChild>
          <Link href="/admin/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg",
            feedback.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-error/10 text-error border border-error/20"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <p>{feedback.message}</p>
        </div>
      )}

      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/admin/users">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Link>
      </Button>

      {/* User Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {user.profile.full_name?.charAt(0) ||
                  user.profile.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {user.profile.full_name || user.profile.email.split("@")[0]}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    planColors[user.subscription?.plan_id || "free"]
                  )}
                >
                  {user.subscription?.plans?.name || "Free"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    statusColors[user.subscription?.status || "active"]
                  )}
                >
                  {user.subscription?.status || "active"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{user.profile.email}</p>
              <p className="text-sm text-muted-foreground">
                Joined {formatDate(new Date(user.profile.created_at))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasPermission("manage_credits") && (
                <Button onClick={() => setShowCreditModal(true)}>
                  <Coins className="w-4 h-4 mr-2" />
                  Adjust Credits
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowNoteModal(true)}>
                <StickyNote className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Credits Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Credit Balance</CardTitle>
                <Coins className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {user.credits?.available_credits ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.credits?.used_this_period ?? 0} used this period
                </p>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rollover:</span>
                    <span>{user.credits?.rollover_credits ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Top-up:</span>
                    <span>{user.credits?.topup_credits ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Subscription</CardTitle>
                <CreditCard className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {user.subscription?.plans?.name || "Free"}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(user.subscription?.plans?.price_cents || 0)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period End:</span>
                    <span>
                      {user.subscription?.current_period_end
                        ? formatDate(new Date(user.subscription.current_period_end))
                        : "-"}
                    </span>
                  </div>
                  {user.subscription?.cancel_at_period_end && (
                    <Badge variant="outline" className="mt-2 text-warning">
                      Cancels at period end
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Activity</CardTitle>
                <History className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Videos Filtered:</span>
                    <span className="font-medium">{user.filterHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Support Tickets:</span>
                    <span className="font-medium">{user.tickets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admin Notes:</span>
                    <span className="font-medium">{user.notes.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Credit Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {user.transactions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {user.transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(tx.created_at))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "font-bold",
                            tx.amount >= 0 ? "text-success" : "text-error"
                          )}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {tx.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {tx.balance_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Credit Transactions</CardTitle>
                <CardDescription>Complete credit history</CardDescription>
              </div>
              {hasPermission("manage_credits") && (
                <Button onClick={() => setShowCreditModal(true)}>
                  <Coins className="w-4 h-4 mr-2" />
                  Adjust Credits
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {user.transactions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-2">
                  {user.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{tx.description || tx.type}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {tx.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(tx.created_at))}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-lg font-bold",
                            tx.amount >= 0 ? "text-success" : "text-error"
                          )}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {tx.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {tx.balance_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter History</CardTitle>
              <CardDescription>Videos filtered by this user</CardDescription>
            </CardHeader>
            <CardContent>
              {user.filterHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No filter history yet
                </p>
              ) : (
                <div className="space-y-3">
                  {user.filterHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium line-clamp-1">
                          {item.videos?.title || "Unknown Video"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.filter_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(item.created_at))}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.credits_used} credits</p>
                        {item.videos?.youtube_id && (
                          <a
                            href={`https://youtube.com/watch?v=${item.videos.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View on YouTube
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>User&apos;s support requests</CardDescription>
            </CardHeader>
            <CardContent>
              {user.tickets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No support tickets
                </p>
              ) : (
                <div className="space-y-3">
                  {user.tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/admin/tickets/${ticket.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(ticket.created_at))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("capitalize", ticketStatusColors[ticket.status])}
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {ticket.priority}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Admin Notes</CardTitle>
                <CardDescription>Internal notes about this user</CardDescription>
              </div>
              <Button onClick={() => setShowNoteModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {user.notes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No notes yet
                </p>
              ) : (
                <div className="space-y-4">
                  {user.notes.map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        note.is_pinned && "border-primary bg-primary/5"
                      )}
                    >
                      {note.is_pinned && (
                        <div className="flex items-center gap-1 text-primary text-xs mb-2">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{note.note}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          By {note.profiles?.full_name || note.profiles?.email || "Admin"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(note.created_at))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credit Adjustment Modal */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              Add or remove credits from this user&apos;s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold">
                {user.credits?.available_credits ?? 0} credits
              </p>
            </div>
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={creditType} onValueChange={setCreditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">General Adjustment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const current = parseInt(creditAmount) || 0;
                    setCreditAmount(String(current - 10));
                  }}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="0"
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const current = parseInt(creditAmount) || 0;
                    setCreditAmount(String(current + 10));
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use negative numbers to remove credits
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Explain the reason for this adjustment..."
                rows={3}
              />
            </div>
            {creditAmount && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  New Balance:{" "}
                  <span className="font-bold">
                    {(user.credits?.available_credits ?? 0) +
                      (parseInt(creditAmount) || 0)}{" "}
                    credits
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreditModal(false)}
              disabled={creditLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreditAdjustment} disabled={creditLoading}>
              {creditLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Apply Adjustment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
            <DialogDescription>
              Add an internal note about this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                rows={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin-note"
                checked={notePinned}
                onChange={(e) => setNotePinned(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="pin-note" className="cursor-pointer">
                Pin this note
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNoteModal(false)}
              disabled={noteLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={noteLoading}>
              {noteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
