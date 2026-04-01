'use client';

/**
 * Org-scoped route segment error boundary.
 *
 * Catches errors thrown within org-specific pages.
 * The dashboard shell (sidebar, header) remains functional.
 */

import { ErrorFallback } from '@/components/dashboard/error-fallback';

export default function OrgSlugError({
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
        heading="Section failed to load"
        description="This section encountered an error. Other sections of the platform continue to work — navigate using the sidebar."
      />
    </div>
  );
}
