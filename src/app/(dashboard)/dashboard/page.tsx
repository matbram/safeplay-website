"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  TrendingUp,
  Clock,
  Film,
  ArrowRight,
  Zap,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";
import { createClient } from "@/lib/supabase/client";

const planNames: Record<string, string> = {
  free: "Free",
  individual: "Individual",
  family: "Family",
  organization: "Organization",
};

const planQuotas: Record<string, number> = {
  free: 30,
  individual: 750,
  family: 1500,
  organization: 3750,
};

interface FilterHistoryItem {
  id: string;
  video_id: string;
  filter_type: string;
  credits_used: number;
  created_at: string;
  videos: {
    title: string;
    youtube_id: string;
    duration_seconds: number;
    thumbnail_url: string | null;
  };
}

export default function DashboardPage() {
  const { user, credits, loading } = useUser();
  const [recentVideos, setRecentVideos] = useState<FilterHistoryItem[]>([]);
  const [stats, setStats] = useState({ totalVideos: 0, totalMinutes: 0, thisMonth: 0 });
  const [loadingHistory, setLoadingHistory] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchHistory() {
      if (!supabase || !user) return;

      try {
        // Fetch recent filter history with video details
        const { data: history, error } = await supabase
          .from("filter_history")
          .select(`
            id,
            video_id,
            filter_type,
            credits_used,
            created_at,
            videos (
              title,
              youtube_id,
              duration_seconds,
              thumbnail_url
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!error && history) {
          setRecentVideos(history as unknown as FilterHistoryItem[]);

          // Calculate stats
          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);

          const totalVideos = history.length;
          const totalMinutes = history.reduce((acc: number, h: { videos?: { duration_seconds?: number } }) => {
            const duration = h.videos?.duration_seconds || 0;
            return acc + Math.ceil(duration / 60);
          }, 0);
          const thisMonthCount = history.filter(
            (h: { created_at: string }) => new Date(h.created_at) >= thisMonth
          ).length;

          setStats({ totalVideos, totalMinutes, thisMonth: thisMonthCount });
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [supabase, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const planTier = user?.subscription_tier || "free";
  const totalCredits = planQuotas[planTier] || 30;
  const availableCredits = credits?.available_credits || 0;
  const usedCredits = credits?.used_this_period || 0;
  const rolloverCredits = credits?.rollover_credits || 0;
  const creditPercentage = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;

  const periodEnd = credits?.period_end ? new Date(credits.period_end) : new Date();
  const daysUntilReset = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const userName = user?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your account.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/filter">
            <Play className="w-5 h-5 mr-2" />
            Filter a Video
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Credit Status Card */}
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Credit Usage</CardTitle>
              <Badge variant="outline" className="font-normal">
                {planNames[planTier]} Plan
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {availableCredits}
                  <span className="text-lg font-normal text-muted-foreground">
                    {" "}
                    / {totalCredits}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  credits remaining this month
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">
                  {creditPercentage}% used
                </p>
              </div>
            </div>

            <Progress value={creditPercentage} className="h-3" />

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{rolloverCredits}</p>
                  <p className="text-xs text-muted-foreground">Rollover credits</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{daysUntilReset} days</p>
                  <p className="text-xs text-muted-foreground">Until reset</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Filtered */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Videos Filtered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Film className="w-8 h-8 text-primary" />
              <div>
                <p className="text-3xl font-bold">{stats.totalVideos}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.thisMonth} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Minutes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Minutes Filtered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-3xl font-bold">{stats.totalMinutes}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalMinutes > 0 ? formatDuration(stats.totalMinutes * 60) : "0 min"} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Videos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Videos</CardTitle>
          <Button variant="ghost" asChild>
            <Link href="/history" className="text-sm">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentVideos.length === 0 ? (
            <div className="text-center py-8">
              <Film className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No videos filtered yet</p>
              <Button asChild className="mt-4">
                <Link href="/filter">Filter your first video</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {video.videos?.thumbnail_url ? (
                      <img
                        src={video.videos.thumbnail_url}
                        alt={video.videos.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
                      {formatDuration(video.videos?.duration_seconds || 0)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{video.videos?.title || "Untitled Video"}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(new Date(video.created_at))}</span>
                      <span>-</span>
                      <span>{video.credits_used} credits</span>
                      <Badge variant="muted" className="text-xs capitalize">
                        {video.filter_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Action */}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`https://youtube.com/watch?v=${video.videos?.youtube_id}`} target="_blank">
                      <Play className="w-4 h-4 mr-1" />
                      Rewatch
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade CTA (for free/lower tier users) */}
      <Card className="bg-gradient-to-r from-primary to-secondary text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Need more credits?</h3>
                <p className="text-white/80 text-sm">
                  Upgrade to Family plan for 1,500 credits/month
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              asChild
            >
              <Link href="/billing">
                Upgrade Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
