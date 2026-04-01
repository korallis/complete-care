'use client';

/**
 * AuditPagination — pagination controls for the audit log table.
 * Updates URL search params to preserve other filters.
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export function AuditPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
}: AuditPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete('page');
    } else {
      params.set('page', String(p));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) {
    return (
      <div className="px-4 py-3 border-t border-[oklch(0.91_0.005_160)] text-xs text-[oklch(0.55_0_0)]">
        {totalCount === 0 ? 'No entries' : `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}`}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[oklch(0.91_0.005_160)]">
      <p className="text-xs text-[oklch(0.55_0_0)]">
        Showing{' '}
        <span className="font-medium text-[oklch(0.25_0_0)]">{from}–{to}</span>
        {' '}of{' '}
        <span className="font-medium text-[oklch(0.25_0_0)]">{totalCount}</span>
        {' '}entries
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.45_0_0)] hover:bg-[oklch(0.97_0.005_160)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Page number buttons — show up to 5 pages */}
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => goToPage(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={pageNum === page ? 'page' : undefined}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors',
                pageNum === page
                  ? 'bg-[oklch(0.22_0.04_160)] text-white shadow-sm'
                  : 'border border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.45_0_0)] hover:bg-[oklch(0.97_0.005_160)]',
              )}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.45_0_0)] hover:bg-[oklch(0.97_0.005_160)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
