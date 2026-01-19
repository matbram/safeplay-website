"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  valueClassName?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  valueClassName,
  loading = false,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-9 w-24 mt-2 bg-muted animate-pulse rounded" />
            ) : (
              <p className={cn("text-3xl font-bold mt-2", valueClassName)}>{value}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && !loading && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.positive ? "text-success" : "text-error"
                  )}
                >
                  {trend.positive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function StatCardGrid({
  children,
  columns = 4,
  className,
}: StatCardGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>{children}</div>
  );
}
