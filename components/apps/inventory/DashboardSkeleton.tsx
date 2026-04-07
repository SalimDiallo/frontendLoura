"use client";

import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

// Skeleton animation utility
const skeletonClass = "animate-pulse bg-muted rounded";

// Metric Card Skeleton
export function MetricCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className={cn("bg-card border", compact ? "p-4" : "p-5")}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className={cn(skeletonClass, "h-3 w-20")} />
          <div className={cn(skeletonClass, compact ? "h-8 w-24" : "h-10 w-32")} />
          {!compact && <div className={cn(skeletonClass, "h-3 w-28")} />}
        </div>
        <div className={cn(skeletonClass, "h-6 w-16 rounded-full")} />
      </div>
    </Card>
  );
}

// Chart Card Skeleton
export function ChartCardSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className={cn(skeletonClass, "h-4 w-40")} />
          <div className={cn(skeletonClass, "h-3 w-32")} />
        </div>

        {/* Chart area */}
        <div className={cn(skeletonClass, `h-[${height}px]`)} style={{ height: `${height}px` }}>
          <div className="flex items-end justify-around h-full p-6 gap-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-muted-foreground/20 rounded-t w-full"
                style={{
                  height: `${Math.random() * 60 + 40}%`,
                  opacity: 0.3 + Math.random() * 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Donut Chart Skeleton
export function DonutChartSkeleton() {
  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className={cn(skeletonClass, "h-4 w-32")} />
            <div className={cn(skeletonClass, "h-3 w-24")} />
          </div>
          <div className={cn(skeletonClass, "h-5 w-20")} />
        </div>

        {/* Donut + Legend */}
        <div className="flex items-center justify-center gap-6">
          <div className={cn(skeletonClass, "h-[200px] w-[200px] rounded-full")} />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(skeletonClass, "w-3 h-3")} />
                <div className="space-y-1">
                  <div className={cn(skeletonClass, "h-3 w-24")} />
                  <div className={cn(skeletonClass, "h-2 w-16")} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Gauge Skeleton
export function GaugeSkeleton() {
  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className={cn(skeletonClass, "h-4 w-32")} />
          <div className={cn(skeletonClass, "h-3 w-28")} />
        </div>

        {/* Gauge */}
        <div className="flex flex-col items-center py-4">
          <div className={cn(skeletonClass, "h-32 w-32 rounded-full")} />

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-6 w-full">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className={cn(skeletonClass, "h-6 w-12 mx-auto")} />
                <div className={cn(skeletonClass, "h-3 w-16 mx-auto")} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className={cn(skeletonClass, "h-4 w-40")} />
            <div className={cn(skeletonClass, "h-3 w-32")} />
          </div>
          <div className={cn(skeletonClass, "h-8 w-20 rounded")} />
        </div>

        {/* Table rows */}
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5">
              <div className={cn(skeletonClass, "h-4 w-6")} />
              <div className="flex-1 space-y-2">
                <div className={cn(skeletonClass, "h-4 w-full")} />
                <div className={cn(skeletonClass, "h-3 w-20")} />
              </div>
              <div className="text-right space-y-2">
                <div className={cn(skeletonClass, "h-4 w-24")} />
                <div className={cn(skeletonClass, "h-3 w-16")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// List with Progress Skeleton
export function ProgressListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className={cn(skeletonClass, "h-4 w-32")} />
            <div className={cn(skeletonClass, "h-3 w-28")} />
          </div>
          <div className={cn(skeletonClass, "h-8 w-20 rounded")} />
        </div>

        {/* List items */}
        <div className="space-y-3">
          {[...Array(items)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className={cn(skeletonClass, "h-4 w-4")} />
                  <div className={cn(skeletonClass, "h-4 w-32")} />
                </div>
                <div className={cn(skeletonClass, "h-4 w-20")} />
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(skeletonClass, "h-1.5 flex-1 rounded-full")} />
                <div className={cn(skeletonClass, "h-3 w-12")} />
              </div>
              <div className="flex gap-3">
                <div className={cn(skeletonClass, "h-3 w-16")} />
                <div className={cn(skeletonClass, "h-3 w-20")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Full Table Skeleton (for category performance)
export function DataTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className={cn(skeletonClass, "h-4 w-48")} />
          <div className={cn(skeletonClass, "h-3 w-36")} />
        </div>

        {/* Table header */}
        <div className="border-b pb-2">
          <div className="flex gap-4">
            <div className={cn(skeletonClass, "h-3 w-32")} />
            <div className={cn(skeletonClass, "h-3 w-16 ml-auto")} />
            <div className={cn(skeletonClass, "h-3 w-20")} />
            <div className={cn(skeletonClass, "h-3 w-24")} />
            <div className={cn(skeletonClass, "h-3 w-24")} />
            <div className={cn(skeletonClass, "h-3 w-16")} />
          </div>
        </div>

        {/* Table rows */}
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center border-b pb-3 last:border-0">
              <div className={cn(skeletonClass, "h-4 w-32")} />
              <div className={cn(skeletonClass, "h-4 w-12 ml-auto")} />
              <div className={cn(skeletonClass, "h-4 w-20")} />
              <div className={cn(skeletonClass, "h-4 w-24")} />
              <div className={cn(skeletonClass, "h-4 w-24")} />
              <div className={cn(skeletonClass, "h-4 w-16")} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Complete Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className={cn(skeletonClass, "h-6 w-40")} />
              <div className={cn(skeletonClass, "h-4 w-32")} />
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(skeletonClass, "h-9 w-9 rounded")} />
              <div className={cn(skeletonClass, "h-9 w-24 rounded")} />
              <div className={cn(skeletonClass, "h-9 w-28 rounded")} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <MetricCardSkeleton key={i} compact />
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCardSkeleton />
          </div>
          <DonutChartSkeleton />
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCardSkeleton />
          </div>
          <GaugeSkeleton />
        </div>

        {/* Tables Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TableSkeleton rows={8} />
          <ProgressListSkeleton items={8} />
        </div>

        {/* Category Table */}
        <DataTableSkeleton />
      </div>
    </div>
  );
}
