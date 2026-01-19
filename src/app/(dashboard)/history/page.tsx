"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Search,
  Download,
  Trash2,
  Filter,
  Film,
  Clock,
  Coins,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";
import { createClient } from "@/lib/supabase/client";

interface HistoryItem {
  id: string;
  video_id: string;
  filter_type: string;
  credits_used: number;
  created_at: string;
  videos?: {
    youtube_id: string;
    title: string;
    channel_name?: string;
    duration_seconds: number;
    thumbnail_url?: string;
  };
}

export default function HistoryPage() {
  const { user, credits, loading: userLoading } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats calculated from real data
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalMinutes: 0,
    totalCredits: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("filter_history")
          .select(`
            id,
            video_id,
            filter_type,
            credits_used,
            created_at,
            videos (
              youtube_id,
              title,
              channel_name,
              duration_seconds,
              thumbnail_url
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching history:", error);
          setHistory([]);
        } else {
          setHistory(data || []);

          // Calculate stats
          const totalVideos = data?.length || 0;
          const totalMinutes = Math.round(
            (data || []).reduce((acc: number, item: HistoryItem) => {
              return acc + (item.videos?.duration_seconds || 0);
            }, 0) / 60
          );
          const totalCredits = (data || []).reduce((acc: number, item: HistoryItem) => {
            return acc + (item.credits_used || 0);
          }, 0);

          setStats({ totalVideos, totalMinutes, totalCredits });
        }
      } catch (err) {
        console.error("Error:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user, supabase]);

  const filteredHistory = history
    .filter((item) => {
      const matchesSearch = (item.videos?.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        filterType === "all" || item.filter_type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "credits":
          return b.credits_used - a.credits_used;
        case "duration":
          return (b.videos?.duration_seconds || 0) - (a.videos?.duration_seconds || 0);
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedHistory.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    }
  };

  const handleExport = () => {
    // Export selected items as CSV
    const itemsToExport = selectedItems.length > 0
      ? history.filter(item => selectedItems.includes(item.id))
      : history;

    const csv = [
      ["Title", "Channel", "Duration", "Filter Type", "Credits Used", "Date"].join(","),
      ...itemsToExport.map(item => [
        `"${item.videos?.title || "Unknown"}"`,
        `"${item.videos?.channel_name || "Unknown"}"`,
        formatDuration(item.videos?.duration_seconds || 0),
        item.filter_type,
        item.credits_used,
        new Date(item.created_at).toISOString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safeplay-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;

    const { error } = await supabase
      .from("filter_history")
      .delete()
      .in("id", selectedItems);

    if (!error) {
      setHistory(history.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Video History</h1>
        <p className="text-muted-foreground">
          View and manage all your filtered videos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                <Film className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVideos}</p>
                <p className="text-xs text-muted-foreground">Videos Filtered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMinutes}</p>
                <p className="text-xs text-muted-foreground">Minutes Filtered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-light flex items-center justify-center">
                <Coins className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCredits}</p>
                <p className="text-xs text-muted-foreground">Credits Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Filter Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mute">Mute</SelectItem>
                <SelectItem value="bleep">Bleep</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="credits">Most Credits</SelectItem>
                <SelectItem value="duration">Longest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-error hover:text-error"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={
                paginatedHistory.length > 0 &&
                selectedItems.length === paginatedHistory.length
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Select all</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {paginatedHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Checkbox */}
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) =>
                    handleSelectItem(item.id, checked as boolean)
                  }
                />

                {/* Thumbnail */}
                <div className="relative w-28 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {item.videos?.thumbnail_url ? (
                    <img
                      src={item.videos.thumbnail_url}
                      alt={item.videos.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-white text-xs">
                    {formatDuration(item.videos?.duration_seconds || 0)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.videos?.title || "Unknown Video"}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {item.videos?.channel_name || "Unknown Channel"}
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(new Date(item.created_at))}
                    </span>
                    <Badge variant="muted" className="text-xs capitalize">
                      {item.filter_type}
                    </Badge>
                    <span className="text-xs text-primary font-medium">
                      {item.credits_used} credits
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    Rewatch
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error"
                    onClick={() => {
                      setSelectedItems([item.id]);
                      handleDelete();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="p-8 text-center">
              <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No videos found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "Try a different search term"
                  : "Start by filtering your first video"}
              </p>
              <Button className="mt-4" asChild>
                <a href="/filter">Filter a Video</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of{" "}
            {filteredHistory.length} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
