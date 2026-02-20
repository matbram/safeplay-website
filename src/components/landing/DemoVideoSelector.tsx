"use client";

import { useState, useMemo } from "react";
import {
  Film,
  Music,
  Mic,
  Laugh,
  Clapperboard,
  Tv,
  Radio,
  Headphones,
  Video,
  Camera,
  MonitorPlay,
  Podcast,
  Megaphone,
  Drama,
  Gamepad2,
  Newspaper,
  BookOpen,
  GraduationCap,
  Globe,
  Trophy,
  Dumbbell,
  Heart,
  Baby,
  Church,
  Utensils,
  Palette,
  Wrench,
  Car,
  Plane,
  Mountain,
} from "lucide-react";
import { DemoPlayer } from "./DemoPlayer";
import { cn } from "@/lib/utils";
import type { VideoCategory, PlayerSettings } from "@/lib/launch-mode";

// Icon name to component map (must match admin icon-picker)
const ICON_MAP: Record<string, React.ElementType> = {
  Film,
  Music,
  Mic,
  Laugh,
  Clapperboard,
  Tv,
  Radio,
  Headphones,
  Video,
  Camera,
  MonitorPlay,
  Podcast,
  Megaphone,
  Drama,
  Gamepad2,
  Newspaper,
  BookOpen,
  GraduationCap,
  Globe,
  Trophy,
  Dumbbell,
  Heart,
  Baby,
  Church,
  Utensils,
  Palette,
  Wrench,
  Car,
  Plane,
  Mountain,
};

interface VideoOption {
  id: string;
  label: string;
  icon: React.ElementType;
}

// Hardcoded fallback when no settings exist in DB
const DEFAULT_VIDEO_OPTIONS: VideoOption[] = [
  { id: "73_1biulkYk", label: "Movie Trailer", icon: Film },
  { id: "vkOJ9uNj9EY", label: "Music Video", icon: Music },
  { id: "G42RJ4mKj1k", label: "Podcast", icon: Mic },
  { id: "AD4raVw11xU", label: "Stand Up", icon: Laugh },
  { id: "OQaLic5SE_I", label: "Sketch Comedy", icon: Clapperboard },
];

interface DemoVideoSelectorProps {
  className?: string;
  videoCategories?: VideoCategory[] | null;
  playerSettings?: PlayerSettings | null;
}

export function DemoVideoSelector({
  className,
  videoCategories,
  playerSettings,
}: DemoVideoSelectorProps) {
  // Convert DB categories to VideoOptions with resolved icon components
  const videoOptions = useMemo<VideoOption[]>(() => {
    if (!videoCategories || videoCategories.length === 0) {
      return DEFAULT_VIDEO_OPTIONS;
    }

    return videoCategories
      .filter((cat) => cat.enabled && cat.id && cat.label)
      .sort((a, b) => a.order - b.order)
      .map((cat) => ({
        id: cat.id,
        label: cat.label,
        icon: ICON_MAP[cat.icon] || Film,
      }));
  }, [videoCategories]);

  const [selectedVideoId, setSelectedVideoId] = useState(
    videoOptions[0]?.id || DEFAULT_VIDEO_OPTIONS[0].id
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Video Type Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {videoOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedVideoId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedVideoId(option.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "border",
                isSelected
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Demo Player - key forces remount when video changes to reset all state */}
      <DemoPlayer
        key={selectedVideoId}
        videoId={selectedVideoId}
        playerSettings={playerSettings}
      />
    </div>
  );
}
