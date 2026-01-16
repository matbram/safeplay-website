"use client";

import Link from "next/link";
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
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";

// Mock data - replace with actual data from API
const mockData = {
  credits: {
    available: 705,
    total: 750,
    used: 45,
    rollover: 320,
    expiringSoon: 45,
    expiringDays: 60,
    periodEnd: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
  },
  stats: {
    totalVideos: 47,
    totalMinutes: 823,
    thisMonth: 12,
  },
  recentVideos: [
    {
      id: "1",
      title: "Amazing Nature Documentary - Episode 5",
      thumbnail: "/placeholder-video.jpg",
      duration: 2732,
      filteredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      credits: 46,
      filterType: "mute",
    },
    {
      id: "2",
      title: "Cooking with Gordon - Perfect Steak",
      thumbnail: "/placeholder-video.jpg",
      duration: 735,
      filteredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      credits: 13,
      filterType: "bleep",
    },
    {
      id: "3",
      title: "Tech Review: Latest Gadgets 2026",
      thumbnail: "/placeholder-video.jpg",
      duration: 1824,
      filteredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      credits: 31,
      filterType: "mute",
    },
  ],
  plan: {
    name: "Individual",
    price: 9.99,
  },
};

export default function DashboardPage() {
  const creditPercentage = Math.round(
    (mockData.credits.used / mockData.credits.total) * 100
  );
  const daysUntilReset = Math.ceil(
    (mockData.credits.periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, John!</h1>
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
                {mockData.plan.name} Plan
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {mockData.credits.available}
                  <span className="text-lg font-normal text-muted-foreground">
                    {" "}
                    / {mockData.credits.total}
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
                  <p className="text-sm font-medium">{mockData.credits.rollover}</p>
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
                <p className="text-3xl font-bold">{mockData.stats.totalVideos}</p>
                <p className="text-xs text-muted-foreground">
                  {mockData.stats.thisMonth} this month
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
                <p className="text-3xl font-bold">{mockData.stats.totalMinutes}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(mockData.stats.totalMinutes * 60)} total
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
          <div className="space-y-4">
            {mockData.recentVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative w-24 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{video.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(video.filteredAt)}</span>
                    <span>-</span>
                    <span>{video.credits} credits</span>
                    <Badge variant="muted" className="text-xs capitalize">
                      {video.filterType}
                    </Badge>
                  </div>
                </div>

                {/* Action */}
                <Button variant="ghost" size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  Rewatch
                </Button>
              </div>
            ))}
          </div>
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
