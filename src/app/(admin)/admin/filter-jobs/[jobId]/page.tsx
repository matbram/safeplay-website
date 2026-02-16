"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Video,
  FileAudio,
  RotateCcw,
  Trash2,
  ExternalLink,
  Loader2,
  Check,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
  HardDrive,
  User,
  Calendar,
  Hash,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ConfirmModal } from "@/components/admin";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface JobDetail {
  id: string;
  job_id: string;
  user_id: string;
  user_email: string;
  user_display_name: string | null;
  youtube_id: string;
  filter_type: string;
  custom_words: string[];
  status: string;
  progress: number;
  credits_used: number;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  resolved: boolean;
  stale: boolean;
  has_download: boolean;
}

interface VideoInfo {
  title: string;
  channel_name: string | null;
  duration_seconds: number;
  thumbnail_url: string;
  has_transcript: boolean;
  has_storage_file: boolean;
  storage_path: string | null;
  cached_at: string;
}

interface RelatedJob {
  job_id: string;
  status: string;
  progress: number;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

interface OrchestratorVideo {
  id?: string;
  youtube_id?: string;
  status?: string;
  error_message?: string;
  storage_path?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
}

interface OrchestratorJob {
  id?: string;
  video_id?: string;
  status?: string;
  progress?: number;
  error?: string;
  error_message?: string;
  error_code?: string;
  external_transcription_id?: string;
  webhook_received_at?: string;
  created_at?: string;
  video?: OrchestratorVideo;
  transcript?: {
    id?: string;
    full_text?: string;
    segments?: unknown[];
    title?: string;
    duration?: number;
  };
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

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function FilterJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useAdmin();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [orchestratorStatus, setOrchestratorStatus] =
    useState<OrchestratorJob | null>(null);
  const [orchestratorError, setOrchestratorError] = useState<string | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<RelatedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [transcriptSaved, setTranscriptSaved] = useState(false);

  // Modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [retranscribeOpen, setRetranscribeOpen] = useState(false);

  const ACTIVE_STATUSES = ["pending", "processing", "downloading", "transcribing"];

  const isActiveJob = useCallback(
    (status?: string) => ACTIVE_STATUSES.includes(status || ""),
    []
  );

  const fetchJobDetail = useCallback(
    async (isPolling = false) => {
      try {
        if (!isPolling) {
          setLoading(true);
          setError(null);
        }
        const response = await fetch(`/api/admin/filter-jobs/${jobId}`);
        if (!response.ok) {
          const data = await response.json();
          if (!isPolling) setError(data.error || "Failed to load job");
          return;
        }
        const data = await response.json();
        setJob(data.job);
        setVideo(data.video);
        setOrchestratorStatus(data.orchestrator_status);
        setOrchestratorError(data.orchestrator_error || null);
        setRelatedJobs(data.related_jobs || []);

        // Detect if transcript was auto-saved by the API
        if (data.transcript_saved) {
          setTranscriptSaved(true);
        }

        // Start or stop polling based on job status
        if (isActiveJob(data.job?.status)) {
          setPolling(true);
        } else {
          setPolling(false);
        }
      } catch {
        if (!isPolling) setError("Failed to fetch job details");
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [jobId, isActiveJob]
  );

  // Initial fetch
  useEffect(() => {
    if (jobId) fetchJobDetail();
  }, [jobId, fetchJobDetail]);

  // Auto-poll every 3 seconds while job is active
  useEffect(() => {
    if (polling) {
      pollingRef.current = setInterval(() => {
        fetchJobDetail(true);
      }, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [polling, fetchJobDetail]);

  const handleAction = async (action: string, onDone?: () => void) => {
    if (!job) return;
    setActionLoading(true);
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
        const result = await response.json();
        onDone?.();
        if (action === "delete") {
          router.push("/admin/filter-jobs");
        } else if (result.job_id && result.job_id !== job.job_id) {
          // Orchestrator returned a new job_id - navigate to it
          router.replace(`/admin/filter-jobs/${result.job_id}`);
        } else {
          // Same job_id, start polling
          setPolling(true);
          fetchJobDetail();
        }
      } else {
        const data = await response.json();
        alert(`Action failed: ${data.error}`);
      }
    } catch {
      alert("Action failed. Check console for details.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTranscript = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/filter-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_transcript",
          job_id: job.job_id,
        }),
      });

      if (response.ok) {
        setTranscriptSaved(true);
        fetchJobDetail();
      } else {
        const data = await response.json();
        alert(`Failed to save transcript: ${data.error}`);
      }
    } catch {
      alert("Failed to save transcript. Check console for details.");
    } finally {
      setActionLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/filter-jobs")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Filter Jobs
        </Button>
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <AlertTriangle className="w-12 h-12 text-error" />
          <h1 className="text-xl font-semibold">
            {error || "Job not found"}
          </h1>
        </div>
      </div>
    );
  }

  const config = statusConfig[job.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/filter-jobs")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Filter Job Details</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {job.job_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {polling && (
            <div className="flex items-center gap-1.5 text-xs text-success mr-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Live
            </div>
          )}
          <Button
            onClick={() => fetchJobDetail()}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Transcript saved success banner */}
      {transcriptSaved && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
          <CheckCircle className="w-5 h-5 text-success shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">
              Transcript saved successfully
            </p>
            <p className="text-xs text-success/70 mt-0.5">
              The transcript from the orchestrator has been saved to the local database.
            </p>
          </div>
        </div>
      )}

      {/* Missing transcript warning */}
      {job.status === "completed" && video && !video.has_transcript && !transcriptSaved && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-warning">
              Job marked as completed but transcript is missing
            </p>
            <p className="text-xs text-warning/70 mt-0.5">
              {orchestratorStatus?.transcript
                ? "The orchestrator has a transcript available. Click 'Save Transcript' to save it to the local database."
                : "This job finished without saving a transcript. Use Retranscribe to re-process the existing download, or Retry to start from scratch."
              }
            </p>
          </div>
          {orchestratorStatus?.transcript && (
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleSaveTranscript}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              Save Transcript
            </Button>
          )}
        </div>
      )}

      {/* Status + Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1",
                  job.resolved
                    ? "bg-success/10 text-success border-success/20 line-through opacity-60"
                    : config.className
                )}
              >
                <StatusIcon
                  className={cn(
                    "w-4 h-4 mr-1.5",
                    isActiveJob(job.status) && "animate-spin"
                  )}
                />
                {config.label}
              </Badge>
              {job.resolved && (
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 bg-success/10 text-success border-success/20"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Resolved
                </Badge>
              )}
              {job.stale && (
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 bg-warning/10 text-warning border-warning/20"
                >
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Stuck
                </Badge>
              )}
              {job.has_download ? (
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 bg-success/10 text-success border-success/20"
                >
                  <HardDrive className="w-4 h-4 mr-1.5" />
                  Download Available
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 bg-muted text-muted-foreground"
                >
                  <HardDrive className="w-4 h-4 mr-1.5" />
                  No Download
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {(job.status === "failed" || job.stale || (job.status === "completed" && video && !video.has_transcript)) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => setRetryOpen(true)}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                  )}
                  Retry
                </Button>
              )}
              {(job.status === "failed" || job.stale || (job.status === "completed" && video && !video.has_transcript)) && job.has_download && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => setRetranscribeOpen(true)}
                >
                  <FileAudio className="w-4 h-4 mr-1.5" />
                  Retranscribe
                </Button>
              )}
              {orchestratorStatus?.transcript && video && !video.has_transcript && !transcriptSaved && (
                <Button
                  size="sm"
                  disabled={actionLoading}
                  onClick={handleSaveTranscript}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Download className="w-4 h-4 mr-1.5" />
                  )}
                  Save Transcript
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-error border-error/30 hover:bg-error/10"
                disabled={actionLoading}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* Progress bar for active jobs */}
          {isActiveJob(job.status) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {job.status === "pending" && "Preparing video..."}
                  {job.status === "downloading" && "Downloading video..."}
                  {job.status === "transcribing" && "Analyzing audio..."}
                  {job.status === "processing" && "Processing..."}
                </span>
                <span className="text-xs font-medium">{job.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Video Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Thumbnail */}
            <div className="flex items-start gap-4">
              <img
                src={
                  video?.thumbnail_url ||
                  `https://img.youtube.com/vi/${job.youtube_id}/hqdefault.jpg`
                }
                alt=""
                className="w-40 h-24 rounded-lg object-cover bg-muted shrink-0"
              />
              <div className="space-y-1 min-w-0">
                {video?.title && (
                  <p className="font-medium text-sm line-clamp-2">
                    {video.title}
                  </p>
                )}
                {video?.channel_name && (
                  <p className="text-xs text-muted-foreground">
                    {video.channel_name}
                  </p>
                )}
                <a
                  href={`https://youtube.com/watch?v=${job.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  {job.youtube_id}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Video metadata */}
            <div className="grid grid-cols-2 gap-3">
              {video?.duration_seconds != null && video.duration_seconds > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">
                    {formatDuration(video.duration_seconds)}
                  </p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Transcript</p>
                <p className="text-sm font-medium">
                  {video?.has_transcript ? (
                    <span className="text-success">Cached</span>
                  ) : (
                    <span className="text-muted-foreground">Not available</span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Storage File</p>
                <p className="text-sm font-medium">
                  {video?.has_storage_file ? (
                    <span className="text-success">Exists</span>
                  ) : job.has_download ? (
                    <span className="text-warning">Inferred</span>
                  ) : (
                    <span className="text-muted-foreground">Not found</span>
                  )}
                </p>
              </div>
              {video?.storage_path && (
                <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                  <p className="text-xs text-muted-foreground">Storage Path</p>
                  <p className="text-xs font-mono truncate">
                    {video.storage_path}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Filter Type</p>
                <p className="text-sm font-medium capitalize">
                  {job.filter_type}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Credits Used</p>
                <p className="text-sm font-medium">{job.credits_used}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Created
                </p>
                <p className="text-sm font-medium">
                  {formatDate(new Date(job.created_at))}
                </p>
              </div>
              {job.completed_at && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Check className="w-3 h-3" /> Completed
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(new Date(job.completed_at))}
                  </p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> User
                </p>
                <p className="text-sm font-medium truncate">
                  {job.user_display_name || job.user_email}
                </p>
                {job.user_display_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {job.user_email}
                  </p>
                )}
              </div>
              {job.custom_words && job.custom_words.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                  <p className="text-xs text-muted-foreground">Custom Words</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.custom_words.map((word: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Details */}
      {job.error && (
        <Card className="border-error/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-error">
              <AlertTriangle className="w-5 h-5" />
              Error Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-error/5 border border-error/10">
              <p className="text-sm font-mono whitespace-pre-wrap break-all">
                {job.error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orchestrator Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Orchestrator Diagnostics</CardTitle>
          <CardDescription>
            Live data from the orchestrator service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orchestratorError && !orchestratorStatus && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning font-medium">Could not reach orchestrator</p>
              <p className="text-xs text-warning/70 font-mono mt-1">{orchestratorError}</p>
            </div>
          )}

          {orchestratorStatus ? (
            <>
              {/* Job status from orchestrator */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Orchestrator Job
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize">
                      {orchestratorStatus.status || "Unknown"}
                    </p>
                  </div>
                  {orchestratorStatus.progress !== undefined && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Raw Progress</p>
                      <p className="text-sm font-medium">
                        {orchestratorStatus.progress}%
                      </p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">ElevenLabs Transcription ID</p>
                    <p className={cn(
                      "text-sm font-mono",
                      orchestratorStatus.external_transcription_id ? "text-success" : "text-muted-foreground"
                    )}>
                      {orchestratorStatus.external_transcription_id || "Not sent"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Webhook Received</p>
                    <p className={cn(
                      "text-sm",
                      orchestratorStatus.webhook_received_at ? "text-success font-medium" : "text-muted-foreground"
                    )}>
                      {orchestratorStatus.webhook_received_at
                        ? formatDate(new Date(orchestratorStatus.webhook_received_at))
                        : "Not yet"
                      }
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Transcript in Response</p>
                    <p className={cn(
                      "text-sm font-medium",
                      orchestratorStatus.transcript ? "text-success" : "text-muted-foreground"
                    )}>
                      {orchestratorStatus.transcript
                        ? `Available (${orchestratorStatus.transcript.segments?.length || 0} segments)`
                        : "Not present"
                      }
                    </p>
                  </div>
                  {orchestratorStatus.created_at && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Created (Orchestrator)</p>
                      <p className="text-sm font-medium">
                        {formatDate(new Date(orchestratorStatus.created_at))}
                      </p>
                    </div>
                  )}
                  {(orchestratorStatus.error_message || orchestratorStatus.error) && (
                    <div className="p-3 rounded-lg bg-error/5 border border-error/10 col-span-full">
                      <p className="text-xs text-muted-foreground">Orchestrator Error</p>
                      <p className="text-sm text-error font-mono whitespace-pre-wrap break-all">
                        {orchestratorStatus.error_message || orchestratorStatus.error}
                      </p>
                      {orchestratorStatus.error_code && (
                        <p className="text-xs text-error/70 mt-1">Code: {orchestratorStatus.error_code}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Video record from orchestrator */}
              {orchestratorStatus.video && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Orchestrator Video Record
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Video Status</p>
                      <p className="text-sm font-medium capitalize">
                        {orchestratorStatus.video.status || "Unknown"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Storage Path</p>
                      <p className={cn(
                        "text-xs font-mono truncate",
                        orchestratorStatus.video.storage_path ? "text-success" : "text-muted-foreground"
                      )}>
                        {orchestratorStatus.video.storage_path || "None"}
                      </p>
                    </div>
                    {orchestratorStatus.video.processing_started_at && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Processing Started</p>
                        <p className="text-sm font-medium">
                          {formatDate(new Date(orchestratorStatus.video.processing_started_at))}
                        </p>
                      </div>
                    )}
                    {orchestratorStatus.video.processing_completed_at && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Processing Completed</p>
                        <p className="text-sm font-medium">
                          {formatDate(new Date(orchestratorStatus.video.processing_completed_at))}
                        </p>
                      </div>
                    )}
                    {orchestratorStatus.video.error_message && (
                      <div className="p-3 rounded-lg bg-error/5 border border-error/10 col-span-full">
                        <p className="text-xs text-muted-foreground">Video Error</p>
                        <p className="text-sm text-error font-mono whitespace-pre-wrap break-all">
                          {orchestratorStatus.video.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw data toggle for debugging */}
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  View raw orchestrator response
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                  {JSON.stringify(orchestratorStatus, null, 2)}
                </pre>
              </details>
            </>
          ) : !orchestratorError ? (
            <p className="text-sm text-muted-foreground">
              No orchestrator data available for this job.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Related Jobs */}
      {relatedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Related Jobs for this Video
            </CardTitle>
            <CardDescription>
              Other processing attempts for the same YouTube video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatedJobs.map((rj) => {
                const rjConfig =
                  statusConfig[rj.status] || statusConfig.pending;
                const RjIcon = rjConfig.icon;

                return (
                  <div
                    key={rj.job_id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/admin/filter-jobs/${rj.job_id}`)
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", rjConfig.className)}
                      >
                        <RjIcon className="w-3 h-3 mr-1" />
                        {rjConfig.label}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground truncate">
                        {rj.job_id}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(rj.created_at))}
                      </p>
                      {rj.error && (
                        <p className="text-xs text-error truncate max-w-[200px]">
                          {rj.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Filter Job"
        description={`Delete job for video ${job.youtube_id}? This will also remove any cached video data and transcript. This cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        onConfirm={() => handleAction("delete", () => setDeleteOpen(false))}
      />

      {/* Retry Confirmation */}
      <ConfirmModal
        open={retryOpen}
        onOpenChange={setRetryOpen}
        title="Retry Filter Job"
        description={`This will redownload and retranscribe video ${job.youtube_id} from scratch. The existing cached data will be cleared.`}
        variant="danger"
        confirmText="Retry"
        onConfirm={() => handleAction("retry", () => setRetryOpen(false))}
      />

      {/* Retranscribe Confirmation */}
      <ConfirmModal
        open={retranscribeOpen}
        onOpenChange={setRetranscribeOpen}
        title="Retranscribe Only"
        description={`This will resend video ${job.youtube_id} for transcription only, skipping the download step. Use this if the download succeeded but transcription failed.`}
        variant="danger"
        confirmText="Retranscribe"
        onConfirm={() =>
          handleAction("retranscribe", () => setRetranscribeOpen(false))
        }
      />
    </div>
  );
}
