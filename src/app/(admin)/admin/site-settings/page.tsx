"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Rocket,
  Mail,
  Download,
  RefreshCw,
  Trash2,
  Search,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Users,
  Calendar,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/admin";
import { useAdmin } from "@/contexts/admin-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  email: string;
  source: string;
  subscribed_at: string;
  metadata: Record<string, unknown>;
  notified_at: string | null;
  converted_at: string | null;
}

interface LaunchModeSettings {
  is_pre_launch: boolean;
  allow_signups: boolean;
}

export default function SiteSettingsPage() {
  const { hasPermission } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Launch mode state
  const [launchMode, setLaunchMode] = useState<LaunchModeSettings>({
    is_pre_launch: true,
    allow_signups: false,
  });
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sourceStats, setSourceStats] = useState<Record<string, number>>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/site-settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.launch_mode) {
          setLaunchMode(data.settings.launch_mode);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        ...(search && { search }),
        ...(sourceFilter && { source: sourceFilter }),
      });

      const response = await fetch(`/api/admin/leads?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setTotalLeads(data.total);
        setSourceStats(data.sourceStats || {});
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, sourceFilter]);

  useEffect(() => {
    fetchSettings();
    fetchLeads();
  }, [fetchSettings, fetchLeads]);

  const handleToggleLaunchMode = async () => {
    if (launchMode.is_pre_launch) {
      // Launching - show confirmation
      setShowLaunchConfirm(true);
    } else {
      // Going back to pre-launch - just do it
      await updateLaunchMode(true);
    }
  };

  const updateLaunchMode = async (isPreLaunch: boolean) => {
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "launch_mode",
          value: {
            is_pre_launch: isPreLaunch,
            allow_signups: !isPreLaunch,
          },
        }),
      });

      if (response.ok) {
        setLaunchMode({
          is_pre_launch: isPreLaunch,
          allow_signups: !isPreLaunch,
        });
      }
    } catch (error) {
      console.error("Failed to update launch mode:", error);
    } finally {
      setSettingsLoading(false);
      setShowLaunchConfirm(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;

    try {
      const response = await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedLead.id }),
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedLead(null);
        fetchLeads();
      }
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  };

  const handleExportLeads = async () => {
    try {
      const response = await fetch("/api/admin/leads?limit=10000");
      if (response.ok) {
        const data = await response.json();
        const csv = [
          ["Email", "Source", "Subscribed At", "Notified At", "Converted At"].join(","),
          ...data.leads.map((lead: Lead) =>
            [
              lead.email,
              lead.source,
              lead.subscribed_at,
              lead.notified_at || "",
              lead.converted_at || "",
            ].join(",")
          ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `safeplay-leads-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export leads:", error);
    }
  };

  if (!hasPermission("manage_users")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-warning" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access site settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">
            Manage launch mode and email leads
          </p>
        </div>
      </div>

      {/* Launch Mode Card */}
      <Card className={cn(
        "border-2 transition-colors",
        launchMode.is_pre_launch ? "border-warning" : "border-success"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                launchMode.is_pre_launch ? "bg-warning/10" : "bg-success/10"
              )}>
                <Rocket className={cn(
                  "w-6 h-6",
                  launchMode.is_pre_launch ? "text-warning" : "text-success"
                )} />
              </div>
              <div>
                <CardTitle className="text-xl">Launch Mode</CardTitle>
                <CardDescription>
                  Control whether the site shows the pre-launch landing page
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-sm px-3 py-1",
                launchMode.is_pre_launch
                  ? "bg-warning/10 text-warning border-warning/20"
                  : "bg-success/10 text-success border-success/20"
              )}
            >
              {launchMode.is_pre_launch ? "Pre-Launch" : "Launched"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">
                {launchMode.is_pre_launch
                  ? "Site is in pre-launch mode"
                  : "Site is live and accessible to all users"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {launchMode.is_pre_launch
                  ? "Visitors see the landing page with email signup. All other pages are locked."
                  : "All pages are accessible. Users can sign up and use the full application."}
              </p>
            </div>
            <Button
              onClick={handleToggleLaunchMode}
              disabled={settingsLoading}
              variant={launchMode.is_pre_launch ? "default" : "outline"}
              className="min-w-[140px]"
            >
              {settingsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : launchMode.is_pre_launch ? (
                <>
                  <ToggleRight className="w-4 h-4 mr-2" />
                  Launch Site
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 mr-2" />
                  Enable Pre-Launch
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Leads Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Email Leads</CardTitle>
                <CardDescription>
                  {totalLeads.toLocaleString()} people waiting for launch
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchLeads} variant="outline" size="sm">
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button onClick={handleExportLeads} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="w-4 h-4" />
                Total Leads
              </div>
              <p className="text-2xl font-bold">{totalLeads.toLocaleString()}</p>
            </div>
            {Object.entries(sourceStats).slice(0, 3).map(([source, count]) => (
              <div key={source} className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <ExternalLink className="w-4 h-4" />
                  {source.replace(/_/g, " ")}
                </div>
                <p className="text-2xl font-bold">{count.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={sourceFilter}
              onValueChange={(value) => {
                setSourceFilter(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.keys(sourceStats).map((source) => (
                  <SelectItem key={source} value={source}>
                    {source.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leads Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No leads found
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                      Signed Up
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{lead.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {lead.source.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(new Date(lead.subscribed_at))}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {lead.converted_at ? (
                          <Badge className="bg-success/10 text-success border-success/20">
                            <Check className="w-3 h-3 mr-1" />
                            Converted
                          </Badge>
                        ) : lead.notified_at ? (
                          <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                            Notified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Waiting</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-error hover:text-error hover:bg-error/10"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalLeads > 25 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, totalLeads)} of {totalLeads}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page * 25 >= totalLeads}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Launch Confirmation Modal */}
      <Dialog open={showLaunchConfirm} onOpenChange={setShowLaunchConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Launch SafePlay?
            </DialogTitle>
            <DialogDescription>
              This will make the full site accessible to everyone. Users will be able to:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Sign up and create accounts
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Access the dashboard and filter videos
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Subscribe to paid plans
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                View all landing pages and documentation
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLaunchConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateLaunchMode(false)}
              disabled={settingsLoading}
            >
              {settingsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              Launch Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Modal */}
      <ConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Lead"
        description={`Are you sure you want to delete ${selectedLead?.email}? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        onConfirm={handleDeleteLead}
      />
    </div>
  );
}
