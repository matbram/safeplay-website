"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Settings,
  Trash2,
  Eye,
  Coins,
  Film,
  Clock,
  Shield,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const mockProfiles = [
  {
    id: "1",
    name: "John (You)",
    avatar_url: null,
    is_child: false,
    is_owner: true,
    credits_used: 220,
    videos_filtered: 18,
  },
  {
    id: "2",
    name: "Sarah",
    avatar_url: null,
    is_child: false,
    is_owner: false,
    credits_used: 250,
    videos_filtered: 15,
  },
  {
    id: "3",
    name: "Tommy",
    avatar_url: null,
    is_child: true,
    is_owner: false,
    credits_used: 130,
    videos_filtered: 8,
    restrictions: {
      max_video_length: 30,
    },
  },
];

const planLimits = {
  maxProfiles: 3,
  currentProfiles: 3,
  totalCredits: 750,
  usedCredits: 600,
};

export default function FamilyPage() {
  const [profiles, setProfiles] = useState(mockProfiles);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<typeof mockProfiles[0] | null>(null);
  const [newProfile, setNewProfile] = useState({
    name: "",
    is_child: false,
    max_video_length: 60,
  });

  const handleAddProfile = () => {
    // TODO: Implement add profile
    setShowAddDialog(false);
    setNewProfile({ name: "", is_child: false, max_video_length: 60 });
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile
    setShowEditDialog(false);
    setSelectedProfile(null);
  };

  const handleDeleteProfile = (id: string) => {
    // TODO: Implement delete profile
    setProfiles(profiles.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Family Profiles</h1>
          <p className="text-muted-foreground">
            Manage profiles and track usage for your family members.
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          disabled={planLimits.currentProfiles >= planLimits.maxProfiles}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </Button>
      </div>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage by Profile</CardTitle>
          <CardDescription>
            See how credits are being used across your family.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Usage</span>
              <span className="font-medium">
                {planLimits.usedCredits} / {planLimits.totalCredits} credits
              </span>
            </div>
            <Progress
              value={(planLimits.usedCredits / planLimits.totalCredits) * 100}
              className="h-3"
            />
          </div>

          {/* Per-Profile Breakdown */}
          <div className="space-y-3">
            {profiles.map((profile) => {
              const percentage = (profile.credits_used / planLimits.totalCredits) * 100;
              return (
                <div key={profile.id} className="flex items-center gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback
                      className={cn(
                        "text-white text-sm",
                        profile.is_owner ? "bg-primary" : "bg-secondary"
                      )}
                    >
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{profile.name}</span>
                      <span className="text-muted-foreground">
                        {profile.credits_used} credits
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          profile.is_owner ? "bg-primary" : "bg-secondary"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <Card key={profile.id} className={cn(profile.is_owner && "border-primary")}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback
                      className={cn(
                        "text-white text-lg",
                        profile.is_owner ? "bg-primary" : "bg-secondary"
                      )}
                    >
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{profile.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {profile.is_owner && (
                        <Badge variant="default" className="text-xs">
                          Owner
                        </Badge>
                      )}
                      {profile.is_child && (
                        <Badge variant="secondary" className="text-xs">
                          Child
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {!profile.is_owner && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowEditDialog(true);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error"
                      onClick={() => handleDeleteProfile(profile.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{profile.credits_used}</p>
                    <p className="text-xs text-muted-foreground">Credits Used</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{profile.videos_filtered}</p>
                    <p className="text-xs text-muted-foreground">Videos</p>
                  </div>
                </div>
              </div>

              {/* Child Restrictions */}
              {profile.is_child && profile.restrictions && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Max {profile.restrictions.max_video_length} min videos
                    </span>
                  </div>
                </div>
              )}

              {/* View History (for parents viewing child) */}
              {profile.is_child && (
                <Button variant="outline" className="w-full mt-4" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Watch History
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add Profile Card */}
        {planLimits.currentProfiles < planLimits.maxProfiles && (
          <Card
            className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setShowAddDialog(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <UserPlus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium">Add Profile</p>
              <p className="text-sm text-muted-foreground mt-1">
                {planLimits.maxProfiles - planLimits.currentProfiles} slots remaining
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upgrade Prompt */}
      {planLimits.currentProfiles >= planLimits.maxProfiles && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Need more profiles?</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Family plan for up to 10 profiles.
                  </p>
                </div>
              </div>
              <Button asChild>
                <a href="/billing">Upgrade Plan</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Profile Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family Profile</DialogTitle>
            <DialogDescription>
              Create a profile for a family member to track their usage separately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Profile Name</Label>
              <Input
                id="profile-name"
                placeholder="e.g., Sarah, Tommy"
                value={newProfile.name}
                onChange={(e) =>
                  setNewProfile({ ...newProfile, name: e.target.value })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Child Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Enable parental controls for this profile.
                </p>
              </div>
              <Switch
                checked={newProfile.is_child}
                onCheckedChange={(checked) =>
                  setNewProfile({ ...newProfile, is_child: checked })
                }
              />
            </div>

            {newProfile.is_child && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <Label htmlFor="max-length">Max Video Length (minutes)</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={newProfile.max_video_length}
                  onChange={(e) =>
                    setNewProfile({
                      ...newProfile,
                      max_video_length: Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Videos longer than this will be blocked for this profile.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProfile} disabled={!newProfile.name.trim()}>
              Add Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update profile settings and restrictions.
            </DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Profile Name</Label>
                <Input
                  id="edit-name"
                  value={selectedProfile.name}
                  onChange={(e) =>
                    setSelectedProfile({
                      ...selectedProfile,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Child Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable parental controls.
                  </p>
                </div>
                <Switch
                  checked={selectedProfile.is_child}
                  onCheckedChange={(checked) =>
                    setSelectedProfile({
                      ...selectedProfile,
                      is_child: checked,
                    })
                  }
                />
              </div>

              {selectedProfile.is_child && (
                <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                  <Label htmlFor="edit-max-length">Max Video Length (minutes)</Label>
                  <Input
                    id="edit-max-length"
                    type="number"
                    defaultValue={selectedProfile.restrictions?.max_video_length || 60}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
