"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Coins,
  Ticket,
  TrendingUp,
  ArrowRight,
  Clock,
  UserPlus,
  DollarSign,
  Activity,
  Video,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatCardGrid } from "@/components/admin";
import { useAdmin } from "@/contexts/admin-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DashboardStats {
  total_users: number;
  active_subscriptions: number;
  total_credits_used: number;
  open_tickets: number;
  new_users_today: number;
  new_users_week: number;
  revenue_this_month: number;
  failed_jobs: number;
  processing_jobs: number;
}

interface FailedJob {
  job_id: string;
  youtube_id: string;
  error: string | null;
  created_at: string;
  user_email: string;
}

interface RecentUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  subscription_tier: string;
}

interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  email: string;
}

const ticketStatusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-secondary/10 text-secondary border-secondary/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  urgent: "bg-error text-white",
  high: "bg-warning text-white",
  normal: "bg-muted text-foreground",
  low: "bg-muted/50 text-muted-foreground",
};

export default function AdminDashboardPage() {
  const { admin } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [recentFailedJobs, setRecentFailedJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentUsers(data.recentUsers || []);
        setRecentTickets(data.recentTickets || []);
        setRecentFailedJobs(data.recentFailedJobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {admin?.full_name || admin?.email?.split("@")[0] || "Admin"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with SafePlay today.
        </p>
      </div>

      {/* Stats Grid */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Users"
          value={stats?.total_users?.toLocaleString() || "0"}
          icon={Users}
          description={`+${stats?.new_users_today || 0} today`}
          loading={loading}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.active_subscriptions?.toLocaleString() || "0"}
          icon={CreditCard}
          description="Paid plans"
          loading={loading}
        />
        <StatCard
          title="Credits Used"
          value={stats?.total_credits_used?.toLocaleString() || "0"}
          icon={Coins}
          description="This period"
          loading={loading}
        />
        <StatCard
          title="Open Tickets"
          value={stats?.open_tickets?.toLocaleString() || "0"}
          icon={Ticket}
          description="Need attention"
          loading={loading}
          valueClassName={stats?.open_tickets && stats.open_tickets > 0 ? "text-warning" : ""}
        />
      </StatCardGrid>

      {/* Failed Jobs Alert Banner */}
      {!loading && stats && stats.failed_jobs > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/20">
          <AlertTriangle className="w-5 h-5 text-error shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-error">
              {stats.failed_jobs} failed filter job{stats.failed_jobs !== 1 && "s"} need attention
            </p>
            <p className="text-xs text-error/70 mt-0.5">
              Users experienced errors during video filtering
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-error/30 text-error hover:bg-error/10">
            <Link href="/admin/filter-jobs?status=failed">
              View Failed Jobs
            </Link>
          </Button>
        </div>
      )}

      {/* Secondary Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="New Users This Week"
          value={stats?.new_users_week?.toLocaleString() || "0"}
          icon={UserPlus}
          loading={loading}
        />
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats?.revenue_this_month || 0)}
          icon={DollarSign}
          loading={loading}
          valueClassName="text-success"
        />
        <StatCard
          title="Filter Pipeline"
          value={
            stats?.failed_jobs && stats.failed_jobs > 0
              ? `${stats.failed_jobs} Failed`
              : stats?.processing_jobs && stats.processing_jobs > 0
              ? `${stats.processing_jobs} Active`
              : "Healthy"
          }
          icon={Video}
          loading={loading}
          valueClassName={
            stats?.failed_jobs && stats.failed_jobs > 0
              ? "text-error"
              : "text-success"
          }
        />
        <StatCard
          title="System Status"
          value="Healthy"
          icon={Activity}
          loading={loading}
          valueClassName="text-success"
        />
      </StatCardGrid>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/users">
                <Users className="w-5 h-5" />
                <span>Manage Users</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/tickets">
                <Ticket className="w-5 h-5" />
                <span>View Tickets</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/credits">
                <Coins className="w-5 h-5" />
                <span>Adjust Credits</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/subscriptions">
                <CreditCard className="w-5 h-5" />
                <span>Subscriptions</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/filter-jobs">
                <Video className="w-5 h-5" />
                <span>Filter Jobs</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Failed Jobs */}
      {recentFailedJobs.length > 0 && (
        <Card className="border-error/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-error" />
                Recent Failed Jobs
              </CardTitle>
              <CardDescription>Jobs that need attention</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/filter-jobs?status=failed">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFailedJobs.map((job) => (
                <Link
                  key={job.job_id}
                  href="/admin/filter-jobs?status=failed"
                  className="flex items-center gap-3 p-3 rounded-lg border border-error/10 hover:border-error/30 hover:bg-error/5 transition-colors"
                >
                  <img
                    src={`https://img.youtube.com/vi/${job.youtube_id}/default.jpg`}
                    alt=""
                    className="w-16 h-12 rounded object-cover bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://youtube.com/watch?v=${job.youtube_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {job.youtube_id}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-error truncate">
                      {job.error || "Unknown error"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.user_email} &middot; {formatDate(new Date(job.created_at))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Users</CardTitle>
              <CardDescription>Newest sign-ups</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No recent users
              </p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.full_name || user.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {user.subscription_tier}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(new Date(user.created_at))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Tickets</CardTitle>
              <CardDescription>Support requests</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/tickets">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="h-4 w-48 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : recentTickets.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No recent tickets
              </p>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium line-clamp-1">
                        {ticket.subject}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", priorityColors[ticket.priority])}
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", ticketStatusColors[ticket.status])}
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {ticket.email}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(new Date(ticket.created_at))}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
