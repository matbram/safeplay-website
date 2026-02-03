"use client";

import { useState } from "react";
import { Film, Music, Mic, Laugh, Clapperboard } from "lucide-react";
import { DemoPlayer } from "./DemoPlayer";
import { cn } from "@/lib/utils";

interface VideoOption {
  id: string;
  label: string;
  icon: React.ElementType;
}

const VIDEO_OPTIONS: VideoOption[] = [
  { id: "73_1biulkYk", label: "Movie Trailer", icon: Film },
  { id: "vkOJ9uNj9EY", label: "Music Video", icon: Music },
  { id: "d5XTDmm0KUQ", label: "Podcast", icon: Mic },
  { id: "AD4raVw11xU", label: "Stand Up", icon: Laugh },
  { id: "OQaLic5SE_I", label: "Sketch Comedy", icon: Clapperboard },
];

interface DemoVideoSelectorProps {
  className?: string;
}

export function DemoVideoSelector({ className }: DemoVideoSelectorProps) {
  const [selectedVideoId, setSelectedVideoId] = useState(VIDEO_OPTIONS[0].id);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Video Type Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {VIDEO_OPTIONS.map((option) => {
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
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Demo Player */}
      <DemoPlayer videoId={selectedVideoId} />
    </div>
  );
}
