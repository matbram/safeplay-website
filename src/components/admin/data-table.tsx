"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends object>({
  data,
  columns,
  keyField,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  searchFields,
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  emptyMessage = "No data found",
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const fieldsToSearch = searchFields || (columns.map((c) => c.key) as (keyof T)[]);

    return data.filter((item) =>
      fieldsToSearch.some((field) => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchFields, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? 1 : -1;
      if (bVal == null) return sortDirection === "asc" ? -1 : 1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUp className="w-4 h-4 ml-1" />;
    return <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Controls */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {pagination && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Show
              </span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:bg-muted/80 select-none",
                      column.className
                    )}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <div className="flex items-center">
                      {column.header}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={String(item[keyField])}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    className={cn(
                      "bg-background hover:bg-muted/30 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${String(item[keyField])}-${column.key}`}
                        className={cn("px-4 py-3 text-sm", column.className)}
                      >
                        {column.render
                          ? column.render(item)
                          : (item[column.key as keyof T] as React.ReactNode) ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}{" "}
            results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
