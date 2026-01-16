"use client";

import { useState } from "react";
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
  Mail,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock user data
const mockUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  avatar_url: null,
  plan: "Individual",
};

const mockPreferences: {
  default_filter_type: "mute" | "bleep";
  sensitivity_level: "low" | "moderate" | "high";
  custom_words: string[];
  auto_save_history: boolean;
  data_retention_days: number | null;
} = {
  default_filter_type: "mute",
  sensitivity_level: "moderate",
  custom_words: ["darn", "heck", "shoot"],
  auto_save_history: true,
  data_retention_days: 90,
};

const mockNotifications = {
  billing_alerts: true,
  usage_alerts: true,
  credit_low_threshold: 80,
  feature_updates: true,
  marketing_emails: false,
};

export default function SettingsPage() {
  const [user, setUser] = useState(mockUser);
  const [preferences, setPreferences] = useState(mockPreferences);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [newCustomWord, setNewCustomWord] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // TODO: Implement save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleAddCustomWord = () => {
    if (
      newCustomWord.trim() &&
      !preferences.custom_words.includes(newCustomWord.trim().toLowerCase())
    ) {
      setPreferences({
        ...preferences,
        custom_words: [
          ...preferences.custom_words,
          newCustomWord.trim().toLowerCase(),
        ],
      });
      setNewCustomWord("");
    }
  };

  const handleRemoveCustomWord = (word: string) => {
    setPreferences({
      ...preferences,
      custom_words: preferences.custom_words.filter((w) => w !== word),
    });
  };

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
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-white text-xl">
                {user.name.charAt(0)}
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
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
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
                onClick={() =>
                  setPreferences({ ...preferences, default_filter_type: "mute" })
                }
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
                onClick={() =>
                  setPreferences({ ...preferences, default_filter_type: "bleep" })
                }
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
              onValueChange={(value: "low" | "moderate" | "high") =>
                setPreferences({ ...preferences, sensitivity_level: value })
              }
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
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, auto_save_history: checked })
              }
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
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, billing_alerts: checked })
              }
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
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, usage_alerts: checked })
              }
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
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, feature_updates: checked })
              }
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
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, marketing_emails: checked })
              }
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
              value={String(preferences.data_retention_days)}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  data_retention_days: value === "forever" ? null : Number(value),
                })
              }
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
            <Button variant="outline" size="sm">
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
                Type your email to confirm: <strong>{user.email}</strong>
              </Label>
              <Input id="confirm-email" placeholder="Enter your email" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive">Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
