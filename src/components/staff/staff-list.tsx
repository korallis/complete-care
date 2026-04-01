'use client';

/**
 * StaffList — interactive staff directory with client-side search controls.
 * Data is fetched server-side (passed as props) and re-fetched on navigation.
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import Link from 'next/link';
import { StaffStatusBadge, StaffContractBadge } from './staff-status-badge';
import { StaffEmptyState } from './staff-empty-state';
import type { StaffListItem } from '@/features/staff/actions';
import {
  STAFF_CONTRACT_TYPES,
  STAFF_STATUSES,
  CONTRACT_TYPE_LABELS,
  STATUS_LABELS,
} from '@/features/staff/schema';

type StaffListProps = {
  staff: StaffListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  orgSlug: string;
  canCreate: boolean;
  searchQuery: string;
  statusFilter: string;
  contractTypeFilter: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function StaffList({
  staff: staffList,
  totalCount,
  page,
  pageSize,
  totalPages,
  orgSlug,
  canCreate,
  searchQuery,
  statusFilter,
  contractTypeFilter,
}: StaffListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateSearch = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 on filter change
      if (!('page' in updates)) {
        params.delete('page');
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const isFiltered = searchQuery || statusFilter !== 'active' || contractTypeFilter;

  return (
    <div className="space-y-4">
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[oklch(0.65_0_0)]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search staff by name, job title, or email..."
            defaultValue={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || val.length >= 2) {
                updateSearch({ search: val || undefined });
              }
            }}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white pl-9 pr-4 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.65_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            aria-label="Search staff"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter || 'active'}
          onChange={(e) => updateSearch({ status: e.target.value })}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
          aria-label="Filter by status"
        >
          {STAFF_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
          <option value="all">All statuses</option>
        </select>

        {/* Contract type filter */}
        <select
          value={contractTypeFilter || ''}
          onChange={(e) =>
            updateSearch({ contractType: e.target.value || undefined })
          }
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
          aria-label="Filter by contract type"
        >
          <option value="">All contracts</option>
          {STAFF_CONTRACT_TYPES.map((ct) => (
            <option key={ct} value={ct}>
              {CONTRACT_TYPE_LABELS[ct]}
            </option>
          ))}
        </select>
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="text-xs text-[oklch(0.55_0_0)] text-center py-1 animate-pulse">
          Loading...
        </div>
      )}

      {/* Results count */}
      {staffList.length > 0 && (
        <p className="text-xs text-[oklch(0.55_0_0)]">
          Showing{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {(page - 1) * pageSize + 1}--{Math.min(page * pageSize, totalCount)}
          </span>{' '}
          of{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {totalCount}
          </span>{' '}
          staff members
        </p>
      )}

      {/* Empty state */}
      {staffList.length === 0 ? (
        <StaffEmptyState
          orgSlug={orgSlug}
          isFiltered={!!isFiltered}
          canCreate={canCreate}
        />
      ) : (
        <>
          {/* List */}
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
            <ul role="list" className="divide-y divide-[oklch(0.95_0.003_160)]">
              {staffList.map((member) => (
                <li key={member.id}>
                  <Link
                    href={`/${orgSlug}/staff/${member.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[oklch(0.985_0.003_160)] transition-colors group focus:outline-none focus:bg-[oklch(0.97_0.005_160)]"
                    aria-label={`View ${member.fullName}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center">
                      <span className="text-sm font-semibold text-[oklch(0.35_0.04_160)]">
                        {getInitials(member.fullName)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[oklch(0.18_0.02_160)] text-sm group-hover:text-[oklch(0.35_0.06_160)] transition-colors truncate">
                          {member.fullName}
                        </span>
                        <StaffStatusBadge status={member.status} />
                        <StaffContractBadge contractType={member.contractType} />
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-[oklch(0.6_0_0)]">
                        <span>{member.jobTitle}</span>
                        {member.email && (
                          <span className="hidden sm:inline truncate">
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-[oklch(0.75_0_0)] group-hover:text-[oklch(0.35_0.06_160)] transition-colors flex-shrink-0"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between"
              aria-label="Pagination"
            >
              <button
                type="button"
                onClick={() => updateSearch({ page: String(page - 1) })}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                aria-label="Previous page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Previous
              </button>

              <span className="text-sm text-[oklch(0.55_0_0)]">
                Page{' '}
                <span className="font-semibold text-[oklch(0.22_0.04_160)]">
                  {page}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[oklch(0.22_0.04_160)]">
                  {totalPages}
                </span>
              </span>

              <button
                type="button"
                onClick={() => updateSearch({ page: String(page + 1) })}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                aria-label="Next page"
              >
                Next
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
