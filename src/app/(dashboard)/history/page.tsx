"use client";

import { useState } from "react";
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
  Calendar,
  Film,
  Clock,
  Coins,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";

// Mock data
const mockHistory = [
  {
    id: "1",
    video: {
      youtube_id: "abc123",
      title: "Amazing Nature Documentary - The Wonders of Planet Earth",
      channel_name: "Nature Channel",
      duration_seconds: 2732,
      thumbnail_url: "",
    },
    filter_type: "mute",
    credits_used: 46,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    video: {
      youtube_id: "def456",
      title: "Cooking with Gordon - Perfect Steak Guide",
      channel_name: "Gordon Ramsay",
      duration_seconds: 735,
      thumbnail_url: "",
    },
    filter_type: "bleep",
    credits_used: 13,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    video: {
      youtube_id: "ghi789",
      title: "Tech Review: Latest Gadgets 2026",
      channel_name: "TechReviewer",
      duration_seconds: 1824,
      thumbnail_url: "",
    },
    filter_type: "mute",
    credits_used: 31,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    video: {
      youtube_id: "jkl012",
      title: "Learn Python Programming - Full Course for Beginners",
      channel_name: "Code Academy",
      duration_seconds: 14400,
      thumbnail_url: "",
    },
    filter_type: "mute",
    credits_used: 240,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    video: {
      youtube_id: "mno345",
      title: "Movie Review: The Latest Blockbuster",
      channel_name: "Film Critics",
      duration_seconds: 1200,
      thumbnail_url: "",
    },
    filter_type: "bleep",
    credits_used: 20,
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
  },
];

const stats = {
  totalVideos: 47,
  totalMinutes: 823,
  totalCredits: 823,
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredHistory = mockHistory
    .filter((item) => {
      const matchesSearch = item.video.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        filterType === "all" || item.filter_type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.created_at.getTime() - a.created_at.getTime();
        case "oldest":
          return a.created_at.getTime() - b.created_at.getTime();
        case "credits":
          return b.credits_used - a.credits_used;
        case "duration":
          return b.video.duration_seconds - a.video.duration_seconds;
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
    // TODO: Implement CSV export
    console.log("Exporting...");
  };

  const handleDelete = () => {
    // TODO: Implement delete
    console.log("Deleting...", selectedItems);
  };

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
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-white text-xs">
                    {formatDuration(item.video.duration_seconds)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.video.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {item.video.channel_name}
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
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
                  <Button variant="ghost" size="sm" className="text-error">
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
