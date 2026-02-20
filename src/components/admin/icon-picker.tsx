"use client";

import { useState } from "react";
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
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Map of icon name to component - curated for video/media content categories
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

export function getIconComponent(name: string): React.ElementType | null {
  return ICON_MAP[name] || null;
}

export function getAvailableIcons(): string[] {
  return Object.keys(ICON_MAP);
}

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const SelectedIcon = getIconComponent(value);
  const iconNames = getAvailableIcons().filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg border border-input bg-background",
          "hover:bg-accent hover:border-accent transition-colors"
        )}
        title="Choose icon"
      >
        {SelectedIcon ? (
          <SelectedIcon className="w-5 h-5 text-foreground" />
        ) : (
          <Film className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose an Icon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto p-1">
              {iconNames.map((name) => {
                const Icon = ICON_MAP[name];
                const isSelected = value === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary text-white"
                        : "hover:bg-accent text-foreground"
                    )}
                    title={name}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] truncate w-full text-center">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
