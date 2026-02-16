"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Video,
  Volume2,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/admin";
import { IconPicker, getIconComponent } from "@/components/admin/icon-picker";
import { useAdmin } from "@/contexts/admin-context";
import { cn } from "@/lib/utils";

// Types
interface VideoCategory {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  order: number;
}

interface PlayerSettings {
  premute_padding_ms: number;
  postmute_padding_ms: number;
  merge_threshold_ms: number;
  default_filter_mode: "mute" | "bleep";
  bleep_frequency: number;
  bleep_volume: number;
}

// Defaults matching current hardcoded values
const DEFAULT_CATEGORIES: VideoCategory[] = [
  { id: "73_1biulkYk", label: "Movie Trailer", icon: "Film", enabled: true, order: 0 },
  { id: "vkOJ9uNj9EY", label: "Music Video", icon: "Music", enabled: true, order: 1 },
  { id: "G42RJ4mKj1k", label: "Podcast", icon: "Mic", enabled: true, order: 2 },
  { id: "AD4raVw11xU", label: "Stand Up", icon: "Laugh", enabled: true, order: 3 },
  { id: "OQaLic5SE_I", label: "Sketch Comedy", icon: "Clapperboard", enabled: true, order: 4 },
];

const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  premute_padding_ms: 80,
  postmute_padding_ms: 0,
  merge_threshold_ms: 0,
  default_filter_mode: "mute",
  bleep_frequency: 1000,
  bleep_volume: 0.35,
};

export default function LaunchModeSettingsPage() {
  const { hasPermission } = useAdmin();

  // Video categories state
  const [categories, setCategories] = useState<VideoCategory[]>(DEFAULT_CATEGORIES);
  const [originalCategories, setOriginalCategories] = useState<VideoCategory[]>(DEFAULT_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesSaving, setCategoriesSaving] = useState(false);
  const [categoriesSaved, setCategoriesSaved] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoCategory | null>(null);

  // Player settings state
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(DEFAULT_PLAYER_SETTINGS);
  const [originalPlayerSettings, setOriginalPlayerSettings] = useState<PlayerSettings>(DEFAULT_PLAYER_SETTINGS);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerSaving, setPlayerSaving] = useState(false);
  const [playerSaved, setPlayerSaved] = useState(false);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/site-settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.launch_video_categories) {
          const cats = data.settings.launch_video_categories as VideoCategory[];
          setCategories(cats);
          setOriginalCategories(cats);
        }
        if (data.settings?.launch_player_settings) {
          const ps = data.settings.launch_player_settings as PlayerSettings;
          setPlayerSettings(ps);
          setOriginalPlayerSettings(ps);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setCategoriesLoading(false);
      setPlayerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Check for unsaved changes
  const categoriesChanged = JSON.stringify(categories) !== JSON.stringify(originalCategories);
  const playerChanged = JSON.stringify(playerSettings) !== JSON.stringify(originalPlayerSettings);

  // Save video categories
  const saveCategories = async () => {
    setCategoriesSaving(true);
    setCategoriesSaved(false);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "launch_video_categories",
          value: categories,
        }),
      });
      if (response.ok) {
        setOriginalCategories([...categories]);
        setCategoriesSaved(true);
        setTimeout(() => setCategoriesSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save categories:", error);
    } finally {
      setCategoriesSaving(false);
    }
  };

  // Save player settings
  const savePlayerSettings = async () => {
    setPlayerSaving(true);
    setPlayerSaved(false);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "launch_player_settings",
          value: playerSettings,
        }),
      });
      if (response.ok) {
        setOriginalPlayerSettings({ ...playerSettings });
        setPlayerSaved(true);
        setTimeout(() => setPlayerSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save player settings:", error);
    } finally {
      setPlayerSaving(false);
    }
  };

  // Category management
  const addCategory = () => {
    const newOrder = categories.length;
    setCategories([
      ...categories,
      {
        id: "",
        label: "",
        icon: "Film",
        enabled: true,
        order: newOrder,
      },
    ]);
  };

  const updateCategory = (index: number, updates: Partial<VideoCategory>) => {
    setCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, ...updates } : cat))
    );
  };

  const removeCategory = (index: number) => {
    setCategories((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((cat, i) => ({ ...cat, order: i }));
    });
    setDeleteTarget(null);
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    setCategories((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated.map((cat, i) => ({ ...cat, order: i }));
    });
  };

  const resetCategories = () => {
    setCategories([...originalCategories]);
  };

  const resetPlayerSettings = () => {
    setPlayerSettings({ ...originalPlayerSettings });
  };

  // Player settings field updater
  const updatePlayerField = <K extends keyof PlayerSettings>(
    field: K,
    value: PlayerSettings[K]
  ) => {
    setPlayerSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (!hasPermission("manage_users")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-warning" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access launch mode settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Launch Mode Settings</h1>
        <p className="text-muted-foreground">
          Configure the pre-launch landing page video categories and player settings
        </p>
      </div>

      {/* Video Categories Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Video Categories</CardTitle>
                <CardDescription>
                  Manage the demo video categories shown on the landing page
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {categoriesChanged && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCategories}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}
              <Button
                onClick={saveCategories}
                disabled={categoriesSaving || !categoriesChanged}
                size="sm"
              >
                {categoriesSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : categoriesSaved ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                {categoriesSaved ? "Saved" : "Save Categories"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Categories List */}
              <div className="space-y-3">
                {categories.map((category, index) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        category.enabled
                          ? "bg-background border-border"
                          : "bg-muted/30 border-border/50 opacity-60"
                      )}
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveCategory(index, "up")}
                          disabled={index === 0}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCategory(index, "down")}
                          disabled={index === categories.length - 1}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Icon Picker */}
                      <IconPicker
                        value={category.icon}
                        onChange={(icon) => updateCategory(index, { icon })}
                      />

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <Input
                          value={category.label}
                          onChange={(e) =>
                            updateCategory(index, { label: e.target.value })
                          }
                          placeholder="Category label"
                          className="h-9"
                        />
                      </div>

                      {/* YouTube ID */}
                      <div className="w-40">
                        <Input
                          value={category.id}
                          onChange={(e) =>
                            updateCategory(index, { id: e.target.value })
                          }
                          placeholder="YouTube ID"
                          className="h-9 font-mono text-xs"
                        />
                      </div>

                      {/* Preview badge */}
                      {category.id && category.label && (
                        <Badge variant="outline" className="hidden lg:flex items-center gap-1.5 text-xs">
                          {IconComponent && <IconComponent className="w-3 h-3" />}
                          {category.label}
                        </Badge>
                      )}

                      {/* Enabled toggle */}
                      <Switch
                        checked={category.enabled}
                        onCheckedChange={(enabled) =>
                          updateCategory(index, { enabled })
                        }
                      />

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-error hover:text-error hover:bg-error/10 h-8 w-8"
                        onClick={() => setDeleteTarget(category)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Add button */}
              <Button
                variant="outline"
                onClick={addCategory}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Video Category
              </Button>

              {categories.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No categories configured. Add one to get started.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Player Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Player Settings</CardTitle>
                <CardDescription>
                  Configure profanity filter timing and audio settings for the demo player
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {playerChanged && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetPlayerSettings}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}
              <Button
                onClick={savePlayerSettings}
                disabled={playerSaving || !playerChanged}
                size="sm"
              >
                {playerSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : playerSaved ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                {playerSaved ? "Saved" : "Save Settings"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {playerLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Premute Padding */}
              <div className="space-y-2">
                <Label htmlFor="premute">Pre-mute Padding (ms)</Label>
                <Input
                  id="premute"
                  type="number"
                  min={0}
                  max={1000}
                  value={playerSettings.premute_padding_ms}
                  onChange={(e) =>
                    updatePlayerField(
                      "premute_padding_ms",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  How many milliseconds before a profanity to start muting. Ensures the beginning of the word is caught.
                </p>
              </div>

              {/* Post-mute Padding */}
              <div className="space-y-2">
                <Label htmlFor="postmute">Post-mute Padding (ms)</Label>
                <Input
                  id="postmute"
                  type="number"
                  min={0}
                  max={1000}
                  value={playerSettings.postmute_padding_ms}
                  onChange={(e) =>
                    updatePlayerField(
                      "postmute_padding_ms",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  How many milliseconds after a profanity to keep muted. Provides a buffer after the word ends.
                </p>
              </div>

              {/* Merge Threshold */}
              <div className="space-y-2">
                <Label htmlFor="merge">Merge Threshold (ms)</Label>
                <Input
                  id="merge"
                  type="number"
                  min={0}
                  max={5000}
                  value={playerSettings.merge_threshold_ms}
                  onChange={(e) =>
                    updatePlayerField(
                      "merge_threshold_ms",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Merge mute intervals that are closer together than this value. Prevents rapid mute/unmute toggling.
                </p>
              </div>

              {/* Default Filter Mode */}
              <div className="space-y-2">
                <Label htmlFor="filter-mode">Default Filter Mode</Label>
                <Select
                  value={playerSettings.default_filter_mode}
                  onValueChange={(value) =>
                    updatePlayerField(
                      "default_filter_mode",
                      value as "mute" | "bleep"
                    )
                  }
                >
                  <SelectTrigger id="filter-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mute">Mute</SelectItem>
                    <SelectItem value="bleep">Bleep</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The default filter mode when a user first loads the demo player.
                </p>
              </div>

              {/* Bleep Frequency */}
              <div className="space-y-2">
                <Label htmlFor="bleep-freq">Bleep Frequency (Hz)</Label>
                <Input
                  id="bleep-freq"
                  type="number"
                  min={200}
                  max={2000}
                  step={10}
                  value={playerSettings.bleep_frequency}
                  onChange={(e) =>
                    updatePlayerField(
                      "bleep_frequency",
                      parseInt(e.target.value) || 1000
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Frequency of the bleep tone in Hertz. Classic TV censor is around 1000Hz.
                </p>
              </div>

              {/* Bleep Volume */}
              <div className="space-y-2">
                <Label htmlFor="bleep-vol">Bleep Volume</Label>
                <Input
                  id="bleep-vol"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={playerSettings.bleep_volume}
                  onChange={(e) =>
                    updatePlayerField(
                      "bleep_volume",
                      parseFloat(e.target.value) || 0.35
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Volume of the bleep tone (0 to 1). Default is 0.35.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Category Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove Category"
        description={`Are you sure you want to remove "${deleteTarget?.label || "this category"}"? This won't delete the video, just removes it from the landing page.`}
        variant="danger"
        confirmText="Remove"
        onConfirm={() => {
          if (deleteTarget) {
            const index = categories.indexOf(deleteTarget);
            if (index !== -1) removeCategory(index);
          }
        }}
      />
    </div>
  );
}
