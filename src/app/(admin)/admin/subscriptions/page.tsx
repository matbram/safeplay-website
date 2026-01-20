"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  CreditCard,
  Users,
  DollarSign,
  TrendingUp,
  ExternalLink,
  MoreHorizontal,
  Eye,
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
import { formatDate, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  profiles: {
    email: string;
    full_name: string | null;
  };
  plans: {
    name: string;
    price_cents: number;
    credits_per_month: number;
  };
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  individual: "bg-primary/10 text-primary",
  family: "bg-secondary/10 text-secondary",
  organization: "bg-success/10 text-success",
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  canceled: "bg-error/10 text-error",
  past_due: "bg-warning/10 text-warning",
  paused: "bg-muted text-muted-foreground",
  trialing: "bg-secondary/10 text-secondary",
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { hasPermission } = useAdmin();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    mrr: 0,
    churnRate: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      !searchQuery ||
      sub.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profiles.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = planFilter === "all" || sub.plan_id === planFilter;
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage user subscriptions and billing
          </p>
        </div>
        <Button onClick={fetchSubscriptions} variant="outline">
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Subscriptions"
          value={stats.total.toLocaleString()}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Active Paid"
          value={stats.active.toLocaleString()}
          icon={CreditCard}
          description="Paid plans"
          loading={loading}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.mrr)}
          icon={DollarSign}
          description="MRR"
          loading={loading}
          valueClassName="text-success"
        />
        <StatCard
          title="Churn Rate"
          value={`${stats.churnRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="This month"
          loading={loading}
        />
      </StatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>
            {filteredSubscriptions.length} subscriptions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No subscriptions found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {sub.profiles.full_name?.charAt(0) ||
                          sub.profiles.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {sub.profiles.full_name || sub.profiles.email.split("@")[0]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sub.profiles.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                      <p className="font-medium">
                        {formatCurrency(sub.plans.price_cents)}
                        <span className="text-muted-foreground">/mo</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.plans.credits_per_month} credits/mo
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("capitalize", planColors[sub.plan_id])}
                      >
                        {sub.plans.name}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn("capitalize", statusColors[sub.status])}
                      >
                        {sub.status}
                      </Badge>
                      {sub.cancel_at_period_end && (
                        <Badge variant="outline" className="text-warning">
                          Canceling
                        </Badge>
                      )}
                    </div>

                    <div className="hidden lg:block text-right text-sm text-muted-foreground">
                      <p>Renews {formatDate(new Date(sub.current_period_end))}</p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/users/${sub.user_id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View User
                        </DropdownMenuItem>
                        {sub.stripe_customer_id && (
                          <DropdownMenuItem asChild>
                            <a
                              href={`https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View in Stripe
                            </a>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
