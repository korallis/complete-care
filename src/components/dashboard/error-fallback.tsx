'use client';

/**
 * ErrorFallback — route segment error boundary UI.
 *
 * Used in error.tsx files at each route segment level.
 * Shows a clear message and recovery options without crashing the whole page.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Custom heading shown to user */
  heading?: string;
  /** Custom description shown to user */
  description?: string;
}

export function ErrorFallback({
  error,
  reset,
  heading = 'Something went wrong',
  description = 'This section failed to load. The rest of the page continues to work.',
}: ErrorFallbackProps) {
  // Log error to console (in production would go to error tracking service)
  useEffect(() => {
    console.error('Route segment error:', error);
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-100 bg-red-50/60 p-8 text-center"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
      </div>

      {/* Text */}
      <div className="space-y-1.5 max-w-sm">
        <h2 className="text-base font-semibold text-red-900">{heading}</h2>
        <p className="text-sm text-red-700">{description}</p>
        {/* Error reference (digest for production debugging) */}
        {error.digest && (
          <p className="text-[11px] font-mono text-red-500/80 mt-2">
            Ref: {error.digest}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-1">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
