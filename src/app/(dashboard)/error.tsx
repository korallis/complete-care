'use client';

/**
 * Dashboard route group error boundary.
 *
 * Catches errors thrown in any dashboard route segment.
 * The sidebar and header remain fully functional even if a page fails.
 */

import { ErrorFallback } from '@/components/dashboard/error-fallback';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <ErrorFallback
        error={error}
        reset={reset}
        heading="Page failed to load"
        description="This page encountered an error. The sidebar and navigation are still working — you can navigate to another section or try again."
      />
    </div>
  );
}
