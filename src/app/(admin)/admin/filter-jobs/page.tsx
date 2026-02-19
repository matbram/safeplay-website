"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Search,
  RefreshCw,
  Trash2,
  RotateCcw,
  FileAudio,
  AlertTriangle,
  Loader2,
  Check,
  CheckCircle,
  X,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmModal } from "@/components/admin";
import { StatCard, StatCardGrid } from "@/components/admin";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FilterJob {
  id: string;
  job_id: string;
  user_id: string;
  user_email: string;
  youtube_id: string;
  filter_type: string;
  status: string;
  progress: number;
  credits_used: number;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  resolved: boolean;
  stale: boolean;
  has_download: boolean;
  has_transcript: boolean;
  needs_review: boolean;
  auto_retry_count: number;
}

interface JobStats {
  total: number;
  failed: number;
  failed_unresolved: number;
  failed_resolved: number;
  processing: number;
  stale: number;
  completed: number;
  needs_review: number;
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    className: "bg-secondary/10 text-secondary border-secondary/20",
    icon: Loader2,
  },
  downloading: {
    label: "Downloading",
    className: "bg-secondary/10 text-secondary border-secondary/20",
    icon: Loader2,
  },
  transcribing: {
    label: "Transcribing",
    className: "bg-secondary/10 text-secondary border-secondary/20",
    icon: FileAudio,
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
    icon: Check,
  },
  failed: {
    label: "Failed",
    className: "bg-error/10 text-error border-error/20",
    icon: X,
  },
};

export default function FilterJobsPage() {
  const router = useRouter();
  const { hasPermission } = useAdmin();
  const [jobs, setJobs] = useState<FilterJob[]>([]);
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    failed: 0,
    failed_unresolved: 0,
    failed_resolved: 0,
    processing: 0,
    stale: 0,
    completed: 0,
    needs_review: 0,
  });
  const [cleaningUp, setCleaningUp] = useState(false);
  const [markingStale, setMarkingStale] = useState(false);
  const [resettingRetries, setResettingRetries] = useState(false);
  const [runningMaintenance, setRunningMaintenance] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state
  const [deleteTarget, setDeleteTarget] = useState<FilterJob | null>(null);
  const [retryTarget, setRetryTarget] = useState<FilterJob | null>(null);
  const [retranscribeTarget, setRetranscribeTarget] =
    useState<FilterJob | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/filter-jobs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
        setTotal(data.total);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch filter jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAction = async (
    action: string,
    job: FilterJob,
    onDone?: () => void
  ) => {
    setActionLoading(job.job_id);
    try {
      const response = await fetch("/api/admin/filter-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          job_id: job.job_id,
          youtube_id: job.youtube_id,
        }),
      });

      if (response.ok) {
        onDone?.();
        fetchJobs();
      } else {
        const data = await response.json();
        alert(`Action failed: ${data.error}`);
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
      alert("Action failed. Check console for details.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkStale = async () => {
    setMarkingStale(true);
    try {
      const response = await fetch("/api/admin/filter-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_stale_failed" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.marked > 0) {
          fetchJobs();
        }
      }
    } catch (error) {
      console.error("Mark stale failed:", error);
    } finally {
      setMarkingStale(false);
    }
  };

  const handleCleanup = async () => {
    setCleaningUp(true);
    try {
      const response = await fetch("/api/admin/filter-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup_resolved" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cleaned > 0) {
          fetchJobs();
        }
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    } finally {
      setCleaningUp(false);
    }
  };

  const handleResetRetries = async () => {
    setResettingRetries(true);
    try {
      const response = await fetch("/api/admin/filter-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_all_retries" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reset > 0) {
          fetchJobs();
        }
      }
    } catch (error) {
      console.error("Reset retries failed:", error);
    } finally {
      setResettingRetries(false);
    }
  };

  const handleRunMaintenance = async () => {
    setRunningMaintenance(true);
    try {
      const response = await fetch("/api/admin/filter-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_maintenance" }),
      });

      if (response.ok) {
        fetchJobs();
      } else {
        const data = await response.json();
        alert(`Maintenance failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Run maintenance failed:", error);
      alert("Maintenance failed. Check console for details.");
    } finally {
      setRunningMaintenance(false);
    }
  };

  if (!hasPermission("manage_users")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-warning" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to view filter jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Filter Jobs</h1>
          <p className="text-muted-foreground">
            Monitor and manage video filtering pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunMaintenance}
            variant="outline"
            size="sm"
            disabled={runningMaintenance}
          >
            {runningMaintenance ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Run Maintenance Now
          </Button>
          <Button onClick={fetchJobs} variant="outline" size="sm">
            <RefreshCw
              className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Resolved banner */}
      {stats.failed_resolved > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
          <CheckCircle className="w-5 h-5 text-success shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">
              {stats.failed_resolved} failed job{stats.failed_resolved !== 1 && "s"} have since been resolved
            </p>
            <p className="text-xs text-success/70 mt-0.5">
              The video was successfully processed on a later attempt
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-success/30 text-success hover:bg-success/10"
            onClick={handleCleanup}
            disabled={cleaningUp}
          >
            {cleaningUp ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            Clean Up Resolved
          </Button>
        </div>
      )}

      {/* Needs human review banner */}
      {stats.needs_review > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/20">
          <UserCheck className="w-5 h-5 text-error shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-error">
              {stats.needs_review} job{stats.needs_review !== 1 && "s"} need human review
            </p>
            <p className="text-xs text-error/70 mt-0.5">
              These jobs have failed {">"}3 automatic retries and require manual investigation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-error/30 text-error hover:bg-error/10"
              onClick={handleResetRetries}
              disabled={resettingRetries}
            >
              {resettingRetries ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-1" />
              )}
              Reset All Retries
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-error/30 text-error hover:bg-error/10"
              onClick={() => {
                setStatusFilter("needs_review");
                setPage(1);
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              View Jobs
            </Button>
          </div>
        </div>
      )}

      {/* Reset retries banner (shown when there are unresolved failures but no needs_review) */}
      {stats.failed_unresolved > 0 && stats.needs_review === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/20">
          <RotateCcw className="w-5 h-5 text-error shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-error">
              {stats.failed_unresolved} unresolved failed job{stats.failed_unresolved !== 1 && "s"}
            </p>
            <p className="text-xs text-error/70 mt-0.5">
              Reset retry counters to allow the maintenance job to retry them
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-error/30 text-error hover:bg-error/10"
            onClick={handleResetRetries}
            disabled={resettingRetries}
          >
            {resettingRetries ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-1" />
            )}
            Reset All Retries
          </Button>
        </div>
      )}

      {/* Stale jobs banner */}
      {stats.stale > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-warning">
              {stats.stale} stuck job{stats.stale !== 1 && "s"} still showing as &quot;processing&quot;
            </p>
            <p className="text-xs text-warning/70 mt-0.5">
              These jobs have been processing for over 30 minutes and are likely stuck
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-warning/30 text-warning hover:bg-warning/10"
            onClick={handleMarkStale}
            disabled={markingStale}
          >
            {markingStale ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <X className="w-4 h-4 mr-1" />
            )}
            Mark as Failed
          </Button>
        </div>
      )}

      {/* Stats */}
      <StatCardGrid columns={5}>
        <StatCard
          title="Total Jobs"
          value={stats.total.toLocaleString()}
          icon={Video}
          loading={loading}
        />
        <StatCard
          title="Completed"
          value={stats.completed.toLocaleString()}
          icon={Check}
          loading={loading}
          valueClassName="text-success"
        />
        <StatCard
          title="Processing"
          value={stats.processing.toLocaleString()}
          icon={Clock}
          loading={loading}
          valueClassName="text-secondary"
        />
        <StatCard
          title="Failed"
          value={
            stats.failed_unresolved > 0
              ? `${stats.failed_unresolved} unresolved`
              : stats.failed.toLocaleString()
          }
          icon={AlertTriangle}
          loading={loading}
          description={
            stats.failed_resolved > 0
              ? `${stats.failed_resolved} resolved`
              : undefined
          }
          valueClassName={stats.failed_unresolved > 0 ? "text-error" : ""}
        />
        <StatCard
          title="Needs Review"
          value={stats.needs_review.toLocaleString()}
          icon={UserCheck}
          loading={loading}
          description="Escalated for human review"
          valueClassName={stats.needs_review > 0 ? "text-error" : ""}
        />
      </StatCardGrid>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Jobs</CardTitle>
              <CardDescription>
                {total.toLocaleString()} total filter jobs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by YouTube ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => {
                setStatusFilter(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Jobs Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No filter jobs found
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Video
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">
                        Error
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {jobs.map((job) => {
                      const config = statusConfig[job.status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      const isActionLoading = actionLoading === job.job_id;

                      return (
                        <tr key={job.id} className="hover:bg-muted/30">
                          {/* Video */}
                          <td className="px-4 py-3">
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => router.push(`/admin/filter-jobs/${job.job_id}`)}
                            >
                              <img
                                src={`https://img.youtube.com/vi/${job.youtube_id}/default.jpg`}
                                alt=""
                                className="w-16 h-12 rounded object-cover bg-muted"
                              />
                              <div>
                                <span className="text-sm font-medium hover:text-primary flex items-center gap-1">
                                  {job.youtube_id}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  {job.filter_type}
                                  {job.credits_used > 0 &&
                                    ` | ${job.credits_used} credits`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* User */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-sm truncate max-w-[180px]">
                              {job.user_email}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs w-fit",
                                  job.resolved
                                    ? "bg-success/10 text-success border-success/20 line-through opacity-60"
                                    : config.className
                                )}
                              >
                                <StatusIcon
                                  className={cn(
                                    "w-3 h-3 mr-1",
                                    job.status === "processing" && "animate-spin"
                                  )}
                                />
                                {config.label}
                              </Badge>
                              {job.resolved && (
                                <Badge
                                  variant="outline"
                                  className="text-xs w-fit bg-success/10 text-success border-success/20"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                              {job.stale && (
                                <Badge
                                  variant="outline"
                                  className="text-xs w-fit bg-warning/10 text-warning border-warning/20"
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Stuck
                                </Badge>
                              )}
                              {job.needs_review && (
                                <Badge
                                  variant="outline"
                                  className="text-xs w-fit bg-error/10 text-error border-error/20"
                                >
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Needs Review
                                </Badge>
                              )}
                              {job.auto_retry_count > 0 && !job.needs_review && job.status === "failed" && (
                                <span className="text-xs text-muted-foreground">
                                  {job.auto_retry_count} auto-retries
                                </span>
                              )}
                              {job.progress > 0 &&
                                job.progress < 100 &&
                                job.status !== "failed" && (
                                  <p className="text-xs text-muted-foreground">
                                    {job.progress}%
                                  </p>
                                )}
                            </div>
                          </td>

                          {/* Error */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {job.error ? (
                              <p className="text-xs text-error max-w-[250px] truncate">
                                {job.error}
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </td>

                          {/* Created */}
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                            {formatDate(new Date(job.created_at))}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View details */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => router.push(`/admin/filter-jobs/${job.job_id}`)}
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Retry - full reprocess */}
                              {(job.status === "failed" || job.stale || (job.status === "completed" && !job.has_transcript)) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={isActionLoading}
                                  onClick={() => setRetryTarget(job)}
                                  title="Retry (full redownload + transcribe)"
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-4 h-4" />
                                  )}
                                </Button>
                              )}

                              {/* Retranscribe - only if download file exists */}
                              {(job.status === "failed" || job.stale || (job.status === "completed" && !job.has_transcript)) && job.has_download && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={isActionLoading}
                                  onClick={() => setRetranscribeTarget(job)}
                                  title="Retranscribe only (skip download)"
                                >
                                  <FileAudio className="w-4 h-4" />
                                </Button>
                              )}

                              {/* Delete */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-error hover:text-error hover:bg-error/10"
                                disabled={isActionLoading}
                                onClick={() => setDeleteTarget(job)}
                                title="Delete job and cached data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {total > 25 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, total)}{" "}
                of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page * 25 >= total}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Filter Job"
        description={`Delete job for video ${deleteTarget?.youtube_id}? This will also remove any cached video data and transcript. This cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTarget)
            handleAction("delete", deleteTarget, () => setDeleteTarget(null));
        }}
      />

      {/* Retry Confirmation */}
      <ConfirmModal
        open={!!retryTarget}
        onOpenChange={(open) => !open && setRetryTarget(null)}
        title="Retry Filter Job"
        description={`This will redownload and retranscribe video ${retryTarget?.youtube_id} from scratch. The existing cached data will be cleared.`}
        variant="danger"
        confirmText="Retry"
        onConfirm={() => {
          if (retryTarget)
            handleAction("retry", retryTarget, () => setRetryTarget(null));
        }}
      />

      {/* Retranscribe Confirmation */}
      <ConfirmModal
        open={!!retranscribeTarget}
        onOpenChange={(open) => !open && setRetranscribeTarget(null)}
        title="Retranscribe Only"
        description={`This will resend video ${retranscribeTarget?.youtube_id} for transcription only, skipping the download step. Use this if the download succeeded but transcription failed.`}
        variant="danger"
        confirmText="Retranscribe"
        onConfirm={() => {
          if (retranscribeTarget)
            handleAction("retranscribe", retranscribeTarget, () =>
              setRetranscribeTarget(null)
            );
        }}
      />
    </div>
  );
}
