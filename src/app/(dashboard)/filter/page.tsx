"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Link as LinkIcon,
  VolumeX,
  Volume2,
  Clock,
  Coins,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  X,
  RefreshCw,
} from "lucide-react";
import { cn, extractYouTubeId, formatDuration } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";

type FilterStatus = "idle" | "loading" | "preview" | "processing" | "success" | "error";

interface VideoPreview {
  youtube_id: string;
  title: string;
  channel_name: string | null;
  duration_seconds: number;
  thumbnail_url: string;
  credit_cost: number;
  cached?: boolean;
  has_transcript?: boolean;
  job_id?: string;
}

interface FilterResult {
  video: VideoPreview;
  credits_used: number;
  history_id?: string;
}

export default function FilterPage() {
  const { credits, loading: userLoading, refetch: refetchUser } = useUser();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<FilterStatus>("idle");
  const [filterType, setFilterType] = useState<"mute" | "bleep">("mute");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Get real user credits
  const userCredits = credits?.available_credits || 0;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/filter/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_id: youtubeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video info");
      }

      // If video is being processed, we need to wait for metadata
      if (data.status === "processing" && data.job_id) {
        setVideoPreview({
          youtube_id: data.youtube_id,
          title: "Fetching video info...",
          channel_name: null,
          duration_seconds: 0,
          thumbnail_url: data.thumbnail_url,
          credit_cost: 0,
          job_id: data.job_id,
        });
        setJobId(data.job_id);
        setStatus("processing");
        setProgressMessage("Fetching video metadata...");
        startPolling(data.job_id);
        return;
      }

      setVideoPreview({
        youtube_id: data.youtube_id,
        title: data.title,
        channel_name: data.channel_name,
        duration_seconds: data.duration_seconds,
        thumbnail_url: data.thumbnail_url,
        credit_cost: data.credit_cost,
        cached: data.cached,
        has_transcript: data.has_transcript,
      });
      setStatus("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch video info");
      setStatus("idle");
    }
  };

  const startPolling = (currentJobId: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    let attempts = 0;
    const maxAttempts = 180; // 6 minutes max

    pollingRef.current = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollingRef.current!);
        setError("Processing timed out. Please try again.");
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(`/api/filter/status/${currentJobId}`);
        const data = await response.json();

        if (!response.ok) {
          clearInterval(pollingRef.current!);
          setError(data.error || "Processing failed");
          setStatus("error");
          return;
        }

        setProgress(data.progress || 0);
        setProgressMessage(data.message || "Processing...");

        // Update video info if available
        if (data.video && videoPreview) {
          setVideoPreview({
            ...videoPreview,
            title: data.video.title || videoPreview.title,
            channel_name: data.video.channel_name,
            duration_seconds: data.video.duration_seconds || videoPreview.duration_seconds,
          });
        }

        if (data.status === "completed") {
          clearInterval(pollingRef.current!);
          setFilterResult({
            video: {
              youtube_id: data.video?.youtube_id || videoPreview?.youtube_id || "",
              title: data.video?.title || videoPreview?.title || "Video",
              channel_name: data.video?.channel_name || null,
              duration_seconds: data.video?.duration_seconds || 0,
              thumbnail_url: data.video?.thumbnail_url || videoPreview?.thumbnail_url || "",
              credit_cost: data.credits_used || 0,
            },
            credits_used: data.credits_used || 0,
            history_id: data.history_id,
          });
          setStatus("success");
          // Refresh user credits
          refetchUser();
        } else if (data.status === "failed") {
          clearInterval(pollingRef.current!);
          setError(data.error || "Processing failed");
          setStatus("error");
        }
      } catch (err) {
        // Don't stop polling on network errors, just log
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleFilter = async () => {
    if (!videoPreview) return;

    // Check credits before starting
    if (videoPreview.credit_cost > userCredits && !videoPreview.has_transcript) {
      setError("Insufficient credits. Please upgrade your plan or purchase more credits.");
      return;
    }

    setStatus("processing");
    setProgress(0);
    setProgressMessage("Starting filter process...");
    setError("");

    try {
      const response = await fetch("/api/filter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_id: videoPreview.youtube_id,
          filter_type: filterType,
          custom_words: customWords.length > 0 ? customWords : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start filtering");
      }

      // If already completed (cached), show success immediately
      if (data.status === "completed") {
        setFilterResult({
          video: {
            youtube_id: data.video?.youtube_id || videoPreview.youtube_id,
            title: data.video?.title || videoPreview.title,
            channel_name: data.video?.channel_name || videoPreview.channel_name,
            duration_seconds: data.video?.duration_seconds || videoPreview.duration_seconds,
            thumbnail_url: data.video?.thumbnail_url || videoPreview.thumbnail_url,
            credit_cost: data.credits_used || 0,
          },
          credits_used: data.credits_used || 0,
          history_id: data.history_id,
        });
        setProgress(100);
        setProgressMessage("Complete!");
        setStatus("success");
        refetchUser();
        return;
      }

      // Processing started, begin polling
      if (data.status === "processing" && data.job_id) {
        setJobId(data.job_id);
        startPolling(data.job_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start filtering");
      setStatus("preview");
    }
  };

  const handleAddCustomWord = () => {
    if (newWord.trim() && !customWords.includes(newWord.trim().toLowerCase())) {
      setCustomWords([...customWords, newWord.trim().toLowerCase()]);
      setNewWord("");
    }
  };

  const handleRemoveCustomWord = (word: string) => {
    setCustomWords(customWords.filter((w) => w !== word));
  };

  const handleReset = () => {
    // Stop any active polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setUrl("");
    setStatus("idle");
    setVideoPreview(null);
    setFilterResult(null);
    setJobId(null);
    setProgress(0);
    setProgressMessage("");
    setError("");
    setCustomWords([]);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Filter a Video</h1>
        <p className="text-muted-foreground">
          Paste a YouTube URL to filter profanity from any video.
        </p>
      </div>

      {/* Credit Balance */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Credits</p>
                <p className="text-xl font-bold">{userCredits} credits</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/billing">Get More</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* URL Input */}
      {(status === "idle" || status === "loading") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enter YouTube URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  icon={<LinkIcon className="w-5 h-5" />}
                  error={error}
                  disabled={status === "loading"}
                />
                <p className="text-xs text-muted-foreground">
                  Supports youtube.com, youtu.be, and YouTube Shorts URLs
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                loading={status === "loading"}
              >
                {status === "loading" ? "Fetching video info..." : "Get Video Info"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {status === "error" && (
        <Card className="border-error">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Processing Failed</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Video Preview */}
      {status === "preview" && videoPreview && (
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Video Info */}
            <div className="flex gap-4">
              <div className="relative w-40 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={videoPreview.thumbnail_url}
                  alt={videoPreview.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
                  {formatDuration(videoPreview.duration_seconds)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg line-clamp-2">
                  {videoPreview.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {videoPreview.channel_name || "Unknown Channel"}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDuration(videoPreview.duration_seconds)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Coins className="w-4 h-4" />
                    <span>
                      {videoPreview.has_transcript ? "Free (cached)" : `${videoPreview.credit_cost} credits`}
                    </span>
                  </div>
                  {videoPreview.has_transcript && (
                    <Badge variant="success" className="text-xs">
                      Previously filtered
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Options */}
            <div className="space-y-4">
              <Label>Filter Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFilterType("mute")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    filterType === "mute"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      filterType === "mute"
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <VolumeX className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Mute</p>
                    <p className="text-xs text-muted-foreground">
                      Silently mute profanity
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("bleep")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    filterType === "bleep"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      filterType === "bleep"
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Bleep</p>
                    <p className="text-xs text-muted-foreground">
                      Replace with bleep tone
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Words */}
            <div className="space-y-3">
              <Label>Custom Word Filter (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Add additional words or phrases to filter
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a word..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomWord();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddCustomWord}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {customWords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customWords.map((word) => (
                    <Badge
                      key={word}
                      variant="secondary"
                      className="pl-2 pr-1 py-1"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomWord(word)}
                        className="ml-1.5 hover:bg-black/10 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Cost Summary */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-semibold">
                  {videoPreview.has_transcript ? "Free (re-watch)" : `${videoPreview.credit_cost} credits`}
                </span>
              </div>
              {!videoPreview.has_transcript && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-muted-foreground">After filtering</span>
                  <span className={cn(
                    "font-semibold",
                    userCredits - videoPreview.credit_cost < 0 && "text-error"
                  )}>
                    {userCredits - videoPreview.credit_cost} credits remaining
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error-light text-error">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleFilter}
                disabled={!videoPreview.has_transcript && videoPreview.credit_cost > userCredits}
              >
                <Play className="w-4 h-4 mr-2" />
                Filter This Video
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {status === "processing" && (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Processing Video</h3>
              <p className="text-muted-foreground mt-1">{progressMessage}</p>
            </div>
            <div className="max-w-xs mx-auto">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
            </div>
            {videoPreview && (
              <div className="p-4 rounded-lg bg-muted/50 text-left">
                <div className="flex gap-4">
                  <div className="relative w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={videoPreview.thumbnail_url}
                      alt={videoPreview.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{videoPreview.title}</p>
                    {videoPreview.channel_name && (
                      <p className="text-xs text-muted-foreground mt-1">{videoPreview.channel_name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {status === "success" && filterResult && (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Video Filtered Successfully!</h3>
              <p className="text-muted-foreground mt-1">
                {filterResult.credits_used > 0
                  ? `${filterResult.credits_used} credits have been deducted from your account.`
                  : "No credits were used (previously filtered video)."}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <div className="flex gap-4">
                <div className="relative w-32 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={filterResult.video.thumbnail_url}
                    alt={filterResult.video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium line-clamp-2">{filterResult.video.title}</p>
                  {filterResult.video.channel_name && (
                    <p className="text-xs text-muted-foreground mt-1">{filterResult.video.channel_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="success">Filtered</Badge>
                    <Badge variant="muted" className="capitalize">
                      {filterType}
                    </Badge>
                    {filterResult.video.duration_seconds > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(filterResult.video.duration_seconds)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                Filter Another Video
              </Button>
              <Button className="flex-1" asChild>
                <a href="/history">View in History</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
