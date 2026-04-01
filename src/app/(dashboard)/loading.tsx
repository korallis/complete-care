/**
 * Dashboard route group loading state.
 *
 * Shown while any dashboard page is loading (Suspense boundary fallback).
 */

import { PageSkeleton } from '@/components/dashboard/page-skeleton';

export default function DashboardLoading() {
  return <PageSkeleton />;
}
