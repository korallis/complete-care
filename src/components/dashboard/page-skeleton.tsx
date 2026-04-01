/**
 * PageSkeleton — reusable skeleton loader for dashboard pages.
 *
 * Used in loading.tsx files as the Suspense boundary fallback.
 * Renders a generic page skeleton with a header, stats cards, and a table.
 */

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Primitive skeleton box
// ---------------------------------------------------------------------------

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[oklch(0.93_0.003_160)]',
        className,
      )}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Page-level skeleton
// ---------------------------------------------------------------------------

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6" aria-label="Loading…" role="status">
      {/* Page title area */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[oklch(0.93_0.005_160)] bg-white p-4 space-y-3"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-[oklch(0.93_0.005_160)] bg-white overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[oklch(0.95_0.003_160)]">
          <Skeleton className="h-4 w-32" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 border-b last:border-0 border-[oklch(0.96_0.003_160)]"
          >
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard home skeleton
// ---------------------------------------------------------------------------

export function DashboardHomeSkeleton() {
  return (
    <div className="p-6 space-y-6" aria-label="Loading dashboard…" role="status">
      {/* Welcome area */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Alert strip */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[oklch(0.93_0.005_160)] bg-white p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[oklch(0.93_0.005_160)] bg-white p-4 space-y-3"
          >
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-1.5">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
