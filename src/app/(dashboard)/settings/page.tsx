"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Lock,
  Shield,
  Bell,
  VolumeX,
  Volume2,
  Trash2,
  Download,
  AlertTriangle,
  Plus,
  X,
  Camera,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";
import { createClient } from "@/lib/supabase/client";

interface Preferences {
  default_filter_type: "mute" | "bleep";
  sensitivity_level: "low" | "moderate" | "high";
  custom_words: string[];
  auto_save_history: boolean;
  data_retention_days: number | null;
}

interface Notifications {
  billing_alerts: boolean;
  usage_alerts: boolean;
  credit_low_threshold: number;
  feature_updates: boolean;
  marketing_emails: boolean;
}

const defaultPreferences: Preferences = {
  default_filter_type: "mute",
  sensitivity_level: "moderate",
  custom_words: [],
  auto_save_history: true,
  data_retention_days: 90,
};

const defaultNotifications: Notifications = {
  billing_alerts: true,
  usage_alerts: true,
  credit_low_threshold: 80,
  feature_updates: true,
  marketing_emails: false,
};

export default function SettingsPage() {
  const { user, loading: userLoading, refetch } = useUser();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [notifications, setNotifications] = useState<Notifications>(defaultNotifications);
  const [newCustomWord, setNewCustomWord] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Load preferences from database
  useEffect(() => {
    async function loadPreferences() {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setPreferences({
            default_filter_type: data.default_filter_type || "mute",
            sensitivity_level: data.sensitivity_level || "moderate",
            custom_words: data.custom_words || [],
            auto_save_history: data.auto_save_history ?? true,
            data_retention_days: data.data_retention_days,
          });
          setNotifications({
            billing_alerts: data.billing_alerts ?? true,
            usage_alerts: data.usage_alerts ?? true,
            credit_low_threshold: data.credit_low_threshold ?? 80,
            feature_updates: data.feature_updates ?? true,
            marketing_emails: data.marketing_emails ?? false,
          });
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user, supabase]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
      }

      refetch();
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          default_filter_type: preferences.default_filter_type,
          sensitivity_level: preferences.sensitivity_level,
          custom_words: preferences.custom_words,
          auto_save_history: preferences.auto_save_history,
          data_retention_days: preferences.data_retention_days,
          billing_alerts: notifications.billing_alerts,
          usage_alerts: notifications.usage_alerts,
          credit_low_threshold: notifications.credit_low_threshold,
          feature_updates: notifications.feature_updates,
          marketing_emails: notifications.marketing_emails,
        });

      if (error) throw error;
    } catch (err) {
      console.error("Error saving preferences:", err);
    }
  };

  const handleAddCustomWord = () => {
    if (
      newCustomWord.trim() &&
      !preferences.custom_words.includes(newCustomWord.trim().toLowerCase())
    ) {
      const updatedPrefs = {
        ...preferences,
        custom_words: [
          ...preferences.custom_words,
          newCustomWord.trim().toLowerCase(),
        ],
      };
      setPreferences(updatedPrefs);
      setNewCustomWord("");
      // Auto-save when adding words
      handleSavePreferences();
    }
  };

  const handleRemoveCustomWord = (word: string) => {
    const updatedPrefs = {
      ...preferences,
      custom_words: preferences.custom_words.filter((w) => w !== word),
    };
    setPreferences(updatedPrefs);
    // Auto-save when removing words
    handleSavePreferences();
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      // Fetch all user data
      const [profileRes, historyRes, prefsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("filter_history").select("*").eq("user_id", user.id),
        supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
      ]);

      const exportData = {
        profile: profileRes.data,
        filter_history: historyRes.data,
        preferences: prefsRes.data,
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "safeplay-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting data:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmEmail !== user.email) return;

    try {
      // Delete user data (cascade will handle related tables)
      // Then delete auth user
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        // If admin delete fails, try signing out
        await supabase.auth.signOut();
        window.location.href = "/";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const userName = user?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and avatar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-white text-xl">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Change Avatar
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveProfile} loading={isSaving}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your password and security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Password */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button variant="outline">Update Password</Button>
          </div>

          <Separator />

          {/* Two-Factor Auth */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Shield className="w-4 h-4 mr-2" />
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <VolumeX className="w-5 h-5" />
            Filter Preferences
          </CardTitle>
          <CardDescription>
            Customize how SafePlay filters your videos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Filter Type */}
          <div className="space-y-3">
            <Label>Default Filter Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setPreferences({ ...preferences, default_filter_type: "mute" });
                  handleSavePreferences();
                }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                  preferences.default_filter_type === "mute"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    preferences.default_filter_type === "mute"
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
                onClick={() => {
                  setPreferences({ ...preferences, default_filter_type: "bleep" });
                  handleSavePreferences();
                }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                  preferences.default_filter_type === "bleep"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    preferences.default_filter_type === "bleep"
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

          {/* Sensitivity Level */}
          <div className="space-y-2">
            <Label>Sensitivity Level</Label>
            <Select
              value={preferences.sensitivity_level}
              onValueChange={(value: "low" | "moderate" | "high") => {
                setPreferences({ ...preferences, sensitivity_level: value });
                handleSavePreferences();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  Low - Only strong profanity
                </SelectItem>
                <SelectItem value="moderate">
                  Moderate - Standard profanity
                </SelectItem>
                <SelectItem value="high">
                  High - Includes mild language
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Words */}
          <div className="space-y-3">
            <Label>Custom Word Filter</Label>
            <p className="text-xs text-muted-foreground">
              Add words you want filtered in addition to the default list.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Add a word..."
                value={newCustomWord}
                onChange={(e) => setNewCustomWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomWord();
                  }
                }}
              />
              <Button onClick={handleAddCustomWord}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {preferences.custom_words.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.custom_words.map((word) => (
                  <Badge key={word} variant="secondary" className="pl-2 pr-1 py-1">
                    {word}
                    <button
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

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-save to History</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save all filtered videos to your history.
              </p>
            </div>
            <Switch
              checked={preferences.auto_save_history}
              onCheckedChange={(checked) => {
                setPreferences({ ...preferences, auto_save_history: checked });
                handleSavePreferences();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what notifications you receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Billing Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about upcoming charges and payment issues.
              </p>
            </div>
            <Switch
              checked={notifications.billing_alerts}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, billing_alerts: checked });
                handleSavePreferences();
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Usage Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you&apos;re running low on credits.
              </p>
            </div>
            <Switch
              checked={notifications.usage_alerts}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, usage_alerts: checked });
                handleSavePreferences();
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Feature Updates</Label>
              <p className="text-sm text-muted-foreground">
                Learn about new features and improvements.
              </p>
            </div>
            <Switch
              checked={notifications.feature_updates}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, feature_updates: checked });
                handleSavePreferences();
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive tips, promotions, and special offers.
              </p>
            </div>
            <Switch
              checked={notifications.marketing_emails}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, marketing_emails: checked });
                handleSavePreferences();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Control your data and privacy settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Retention */}
          <div className="space-y-2">
            <Label>Data Retention</Label>
            <p className="text-sm text-muted-foreground">
              How long to keep your video history.
            </p>
            <Select
              value={String(preferences.data_retention_days || "forever")}
              onValueChange={(value) => {
                setPreferences({
                  ...preferences,
                  data_retention_days: value === "forever" ? null : Number(value),
                });
                handleSavePreferences();
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Data */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Export Your Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your data in JSON format.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-error/50 bg-error/5">
            <div>
              <p className="font-medium text-error">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-error hover:text-error border-error/50"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 rounded-lg bg-error/10 text-sm">
              <p className="font-medium text-error mb-2">
                This will permanently delete:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>- Your account and profile information</li>
                <li>- All video filtering history</li>
                <li>- Saved preferences and custom words</li>
                <li>- Any remaining credits</li>
              </ul>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="confirm-email">
                Type your email to confirm: <strong>{user?.email}</strong>
              </Label>
              <Input
                id="confirm-email"
                placeholder="Enter your email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmEmail !== user?.email}
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
