'use client';

/**
 * AuditLogFilters — search and filter controls for the central audit log page.
 *
 * Controls:
 * - Free-text search (entity ID / action)
 * - Action type filter (create, update, delete)
 * - Entity type filter (person, care_plan, staff, etc.)
 * - Date range (from / to)
 * - Clear all filters button
 *
 * Uses URL search params so filters are bookmarkable and shareable.
 */

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_OPTIONS = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

interface AuditLogFiltersProps {
  /** List of entity types present in the org's audit log */
  entityTypes: string[];
  /** List of org members for the user filter */
  members?: Array<{ id: string; name: string }>;
  className?: string;
}

export function AuditLogFilters({ entityTypes, members = [], className }: AuditLogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') ?? '';
  const currentAction = searchParams.get('action') ?? '';
  const currentEntityType = searchParams.get('entityType') ?? '';
  const currentUserId = searchParams.get('userId') ?? '';
  const currentDateFrom = searchParams.get('dateFrom') ?? '';
  const currentDateTo = searchParams.get('dateTo') ?? '';

  const hasFilters =
    currentSearch || currentAction || currentEntityType || currentUserId || currentDateFrom || currentDateTo;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filters change
      params.delete('page');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-xs">
          <label htmlFor="audit-search" className="block text-xs font-medium text-[oklch(0.45_0_0)] mb-1.5">
            Search
          </label>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[oklch(0.6_0_0)]"
              aria-hidden="true"
            />
            <input
              id="audit-search"
              type="text"
              value={currentSearch}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search entity ID, action…"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white py-2 pl-8 pr-3 text-sm text-[oklch(0.2_0_0)] placeholder:text-[oklch(0.65_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)/0.3] focus:border-[oklch(0.35_0.06_160)] transition-colors"
            />
          </div>
        </div>

        {/* Action type */}
        <div className="w-40">
          <label htmlFor="audit-action" className="block text-xs font-medium text-[oklch(0.45_0_0)] mb-1.5">
            Action
          </label>
          <select
            id="audit-action"
            value={currentAction}
            onChange={(e) => updateParam('action', e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white py-2 px-3 text-sm text-[oklch(0.2_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)/0.3] focus:border-[oklch(0.35_0.06_160)] transition-colors"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Entity type */}
        <div className="w-44">
          <label htmlFor="audit-entity-type" className="block text-xs font-medium text-[oklch(0.45_0_0)] mb-1.5">
            Entity type
          </label>
          <select
            id="audit-entity-type"
            value={currentEntityType}
            onChange={(e) => updateParam('entityType', e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white py-2 px-3 text-sm text-[oklch(0.2_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)/0.3] focus:border-[oklch(0.35_0.06_160)] transition-colors"
          >
            <option value="">All entities</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* User filter */}
        {members.length > 0 && (
          <div className="w-48">
            <label htmlFor="audit-user" className="block text-xs font-medium text-[oklch(0.45_0_0)] mb-1.5">
              User
            </label>
            <select
              id="audit-user"
              value={currentUserId}
              onChange={(e) => updateParam('userId', e.target.value)}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white py-2 px-3 text-sm text-[oklch(0.2_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)/0.3] focus:border-[oklch(0.35_0.06_160)] transition-colors"
            >
              <option value="">All users</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date from */}
        <div className="w-40">
          <label htmlFor="audit-date-from" className="block text-xs font-medium text-[oklch(0.45_0_0)] mb-1.5">
            From
          </label>
          <input
            id="audit-date-from"
            type="date"
            value={currentDateFrom}
            onChange={(e) => updateParam('dateFrom', e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white py-2 px-3 text-sm text-[oklch(0.2_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)/0.3] focus:border-[oklch(0.35_0.06_160)] transition-colors"
          />
        </div>

        {/* Date to */}
        <div className="w-40">
          <label htmlFor="audit-date-to" className="block text-xs font-medium text-[oklch(0.45_0_0)] mb-1.5">
            To
          </label>
          <input
            id="audit-date-to"
            type="date"
            value={currentDateTo}
            onChange={(e) => updateParam('dateTo', e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white py-2 px-3 text-sm text-[oklch(0.2_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)/0.3] focus:border-[oklch(0.35_0.06_160)] transition-colors"
          />
        </div>

        {/* Clear all */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.45_0_0)] hover:bg-[oklch(0.97_0.005_160)] hover:text-[oklch(0.25_0.03_160)] transition-colors self-end"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </button>
        )}

        {/* Loading indicator */}
        {isPending && (
          <div className="flex items-center gap-1.5 self-end pb-2 text-xs text-[oklch(0.55_0.04_160)]">
            <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Active filters">
          <span className="flex items-center gap-1 text-xs text-[oklch(0.55_0_0)]">
            <Filter className="h-3 w-3" aria-hidden="true" />
            Filters:
          </span>
          {currentSearch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.22_0.04_160)/0.08] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.22_0.04_160)]">
              Search: &quot;{currentSearch}&quot;
              <button
                type="button"
                onClick={() => updateParam('search', '')}
                aria-label="Remove search filter"
                className="hover:opacity-60 transition-opacity"
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </span>
          )}
          {currentAction && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.22_0.04_160)/0.08] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.22_0.04_160)] capitalize">
              {currentAction}
              <button
                type="button"
                onClick={() => updateParam('action', '')}
                aria-label="Remove action filter"
                className="hover:opacity-60 transition-opacity"
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </span>
          )}
          {currentEntityType && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.22_0.04_160)/0.08] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.22_0.04_160)]">
              {currentEntityType.replace(/_/g, ' ')}
              <button
                type="button"
                onClick={() => updateParam('entityType', '')}
                aria-label="Remove entity type filter"
                className="hover:opacity-60 transition-opacity"
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </span>
          )}
          {currentUserId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.22_0.04_160)/0.08] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.22_0.04_160)]">
              User: {members.find((m) => m.id === currentUserId)?.name ?? currentUserId}
              <button
                type="button"
                onClick={() => updateParam('userId', '')}
                aria-label="Remove user filter"
                className="hover:opacity-60 transition-opacity"
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </span>
          )}
          {currentDateFrom && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.22_0.04_160)/0.08] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.22_0.04_160)]">
              From: {currentDateFrom}
              <button
                type="button"
                onClick={() => updateParam('dateFrom', '')}
                aria-label="Remove date from filter"
                className="hover:opacity-60 transition-opacity"
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </span>
          )}
          {currentDateTo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.22_0.04_160)/0.08] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.22_0.04_160)]">
              To: {currentDateTo}
              <button
                type="button"
                onClick={() => updateParam('dateTo', '')}
                aria-label="Remove date to filter"
                className="hover:opacity-60 transition-opacity"
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
