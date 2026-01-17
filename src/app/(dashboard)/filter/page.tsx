"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn, extractYouTubeId, formatDuration, calculateCreditCost } from "@/lib/utils";

type FilterStatus = "idle" | "loading" | "preview" | "processing" | "success" | "error";

interface VideoPreview {
  youtube_id: string;
  title: string;
  channel_name: string;
  duration_seconds: number;
  thumbnail_url: string;
  credit_cost: number;
}

export default function FilterPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<FilterStatus>("idle");
  const [filterType, setFilterType] = useState<"mute" | "bleep">("mute");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");

  // Mock data
  const userCredits = 705;
  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setStatus("loading");

    // Simulate API call to get video metadata
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock video data
    setVideoPreview({
      youtube_id: youtubeId,
      title: "Amazing Nature Documentary - The Wonders of Planet Earth",
      channel_name: "Nature Channel",
      duration_seconds: 2732,
      thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      credit_cost: calculateCreditCost(2732),
    });
    setStatus("preview");
  };

  const handleFilter = async () => {
    if (!videoPreview) return;

    if (videoPreview.credit_cost > userCredits) {
      setError("Insufficient credits. Please upgrade your plan.");
      return;
    }

    setStatus("processing");
    setProgress(0);

    // Simulate processing stages
    const stages = [
      { progress: 10, message: "Preparing video..." },
      { progress: 25, message: "Downloading video..." },
      { progress: 50, message: "Extracting audio..." },
      { progress: 75, message: "Analyzing audio..." },
      { progress: 90, message: "Detecting profanity..." },
      { progress: 100, message: "Complete!" },
    ];

    for (const stage of stages) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProgress(stage.progress);
      setProgressMessage(stage.message);
    }

    setStatus("success");
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
    setUrl("");
    setStatus("idle");
    setVideoPreview(null);
    setProgress(0);
    setProgressMessage("");
    setError("");
  };

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
                  {videoPreview.channel_name}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDuration(videoPreview.duration_seconds)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Coins className="w-4 h-4" />
                    <span>{videoPreview.credit_cost} credits</span>
                  </div>
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
                  {videoPreview.credit_cost} credits
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-muted-foreground">After filtering</span>
                <span className="font-semibold">
                  {userCredits - videoPreview.credit_cost} credits remaining
                </span>
              </div>
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
                disabled={videoPreview.credit_cost > userCredits}
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
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {status === "success" && videoPreview && (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Video Filtered Successfully!</h3>
              <p className="text-muted-foreground mt-1">
                {videoPreview.credit_cost} credits have been deducted from your account.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <div className="flex gap-4">
                <div className="relative w-32 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={videoPreview.thumbnail_url}
                    alt={videoPreview.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium line-clamp-2">{videoPreview.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="success">Filtered</Badge>
                    <Badge variant="muted" className="capitalize">
                      {filterType}
                    </Badge>
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
