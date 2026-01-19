"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowRight,
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
import { StatCard, StatCardGrid, DataTable, Column } from "@/components/admin";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string | null;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

interface CreditStats {
  totalCreditsUsed: number;
  totalCreditsIssued: number;
  totalAdjustments: number;
  averageUsagePerUser: number;
}

const typeColors: Record<string, string> = {
  subscription_renewal: "bg-success/10 text-success",
  video_filter: "bg-secondary/10 text-secondary",
  rollover: "bg-muted text-muted-foreground",
  adjustment: "bg-warning/10 text-warning",
  refund: "bg-primary/10 text-primary",
  topup: "bg-primary/10 text-primary",
  bonus: "bg-success/10 text-success",
  correction: "bg-warning/10 text-warning",
};

export default function AdminCreditsPage() {
  const router = useRouter();
  const { hasPermission } = useAdmin();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/admin/credits?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, typeFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchTransactions]);

  const columns: Column<CreditTransaction>[] = [
    {
      key: "user",
      header: "User",
      render: (tx) => (
        <div>
          <p className="font-medium">
            {tx.profiles.full_name || tx.profiles.email.split("@")[0]}
          </p>
          <p className="text-xs text-muted-foreground">{tx.profiles.email}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (tx) => (
        <Badge
          variant="outline"
          className={cn("capitalize", typeColors[tx.type])}
        >
          {tx.type.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (tx) => (
        <div className="flex items-center justify-end gap-1">
          {tx.amount >= 0 ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-error" />
          )}
          <span
            className={cn(
              "font-bold",
              tx.amount >= 0 ? "text-success" : "text-error"
            )}
          >
            {tx.amount >= 0 ? "+" : ""}
            {tx.amount}
          </span>
        </div>
      ),
    },
    {
      key: "balance_after",
      header: "Balance After",
      className: "text-right",
      render: (tx) => <span className="font-medium">{tx.balance_after}</span>,
    },
    {
      key: "description",
      header: "Description",
      render: (tx) => (
        <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
          {tx.description || "-"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      render: (tx) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(new Date(tx.created_at))}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (tx) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/users/${tx.user_id}?tab=credits`)}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Credit Management</h1>
          <p className="text-muted-foreground">
            View and manage credit transactions across all users
          </p>
        </div>
        <Button onClick={fetchTransactions} variant="outline">
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Credits Used"
          value={(stats?.totalCreditsUsed || 0).toLocaleString()}
          icon={Coins}
          description="All time"
          loading={loading}
        />
        <StatCard
          title="Credits Issued"
          value={(stats?.totalCreditsIssued || 0).toLocaleString()}
          icon={TrendingUp}
          description="This month"
          loading={loading}
          valueClassName="text-success"
        />
        <StatCard
          title="Manual Adjustments"
          value={(stats?.totalAdjustments || 0).toLocaleString()}
          icon={Coins}
          description="This month"
          loading={loading}
        />
        <StatCard
          title="Avg Usage/User"
          value={(stats?.averageUsagePerUser || 0).toFixed(1)}
          icon={TrendingDown}
          description="Credits per user"
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
                placeholder="Search by user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription_renewal">Subscription</SelectItem>
                <SelectItem value="video_filter">Video Filter</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="topup">Top-up</SelectItem>
                <SelectItem value="rollover">Rollover</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {pagination.total.toLocaleString()} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={transactions}
            columns={columns}
            keyField="id"
            loading={loading}
            searchable={false}
            pagination={true}
            pageSize={pagination.limit}
            emptyMessage="No transactions found"
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
