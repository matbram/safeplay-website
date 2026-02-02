"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  CreditCard,
  Ticket,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Coins,
  Home,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AdminProvider, useAdmin } from "@/contexts/admin-context";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Credits", href: "/admin/credits", icon: Coins },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Support Tickets", href: "/admin/tickets", icon: Ticket },
  { name: "Audit Log", href: "/admin/audit-log", icon: ScrollText, permission: "view_audit_log" as const },
  { name: "Admin Settings", href: "/admin/settings", icon: Settings, permission: "manage_admins" as const },
];

const roleColors: Record<string, string> = {
  super_admin: "bg-primary text-white",
  admin: "bg-secondary text-white",
  support: "bg-muted text-foreground",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
};

function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, loading, error, hasPermission, signOut } = useAdmin();

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (error || !admin)) {
      router.push("/login?returnTo=/admin");
    }
  }, [loading, error, admin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-warning" />
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access the admin panel.
          </p>
          <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const visibleNavigation = navigation.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">SafePlay</span>
                <span className="text-xs text-primary font-medium">Admin Panel</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-4 border-t" />

            {/* Quick Links */}
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Home className="w-5 h-5" />
              User Dashboard
            </Link>
          </nav>

          {/* Admin Info */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary text-white">
                  {admin.full_name?.charAt(0) || admin.email?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {admin.full_name || admin.email?.split("@")[0] || "Admin"}
                </p>
                <Badge
                  variant="outline"
                  className={cn("text-xs", roleColors[admin.role])}
                >
                  {roleLabels[admin.role]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-background/95 backdrop-blur border-b lg:px-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / Page Title */}
          <div className="hidden lg:flex items-center gap-2">
            <Badge variant="outline" className="font-normal text-xs">
              Admin
            </Badge>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-semibold">
              {visibleNavigation.find(
                (n) => pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href))
              )?.name || "Dashboard"}
            </h1>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-accent">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>

            {/* Admin Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary text-white text-sm">
                    {admin.full_name?.charAt(0) || admin.email?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">
                      {admin.full_name || admin.email?.split("@")[0] || "Admin"}
                    </p>
                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs mt-1", roleColors[admin.role])}
                    >
                      {roleLabels[admin.role]}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <Home className="w-4 h-4 mr-2" />
                    User Dashboard
                  </Link>
                </DropdownMenuItem>
                {hasPermission("manage_admins") && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-error" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminContent>{children}</AdminContent>
    </AdminProvider>
  );
}
