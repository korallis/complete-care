'use client';

/**
 * PersonsList — interactive persons list with client-side search controls.
 * Data is fetched server-side (passed as props) and re-fetched on navigation.
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import Link from 'next/link';
import { PersonAvatar } from './person-avatar';
import { PersonTypeBadge, PersonStatusBadge } from './person-type-badge';
import { PersonsEmptyState } from './persons-empty-state';
import { calculateAge, formatDateOfBirth } from '@/features/persons/utils';
import type { PersonListItem } from '@/features/persons/actions';
import type { PersonTerminology } from '@/features/persons/utils';

type PersonsListProps = {
  persons: PersonListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  orgSlug: string;
  terminology: PersonTerminology;
  canCreate: boolean;
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
};

export function PersonsList({
  persons: personList,
  totalCount,
  page,
  pageSize,
  totalPages,
  orgSlug,
  terminology,
  canCreate,
  searchQuery,
  statusFilter,
  typeFilter,
}: PersonsListProps) {
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
      params.delete('page');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const isFiltered = searchQuery || statusFilter !== 'active' || typeFilter;

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
            placeholder={`Search ${terminology.pluralLower} by name or NHS number…`}
            defaultValue={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || val.length >= 2) {
                updateSearch({ search: val || undefined });
              }
            }}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white pl-9 pr-4 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.65_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            aria-label={`Search ${terminology.pluralLower}`}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter || 'active'}
          onChange={(e) => updateSearch({ status: e.target.value })}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
          aria-label="Filter by status"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All statuses</option>
        </select>

        {/* Type filter */}
        <select
          value={typeFilter || ''}
          onChange={(e) => updateSearch({ type: e.target.value || undefined })}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="resident">Resident</option>
          <option value="client">Client</option>
          <option value="young_person">Young Person</option>
        </select>
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="text-xs text-[oklch(0.55_0_0)] text-center py-1 animate-pulse">
          Loading…
        </div>
      )}

      {/* Results count */}
      {personList.length > 0 && (
        <p className="text-xs text-[oklch(0.55_0_0)]">
          Showing{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
          </span>{' '}
          of{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {totalCount}
          </span>{' '}
          {terminology.pluralLower}
        </p>
      )}

      {/* Empty state */}
      {personList.length === 0 ? (
        <PersonsEmptyState
          orgSlug={orgSlug}
          terminology={terminology}
          isFiltered={!!isFiltered}
          canCreate={canCreate}
        />
      ) : (
        <>
          {/* List */}
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
            <ul role="list" className="divide-y divide-[oklch(0.95_0.003_160)]">
              {personList.map((person) => {
                const age = calculateAge(person.dateOfBirth);
                const hasAllergies = person.allergies.length > 0;

                return (
                  <li key={person.id}>
                    <Link
                      href={`/${orgSlug}/persons/${person.id}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[oklch(0.985_0.003_160)] transition-colors group focus:outline-none focus:bg-[oklch(0.97_0.005_160)]"
                      aria-label={`View ${person.fullName}`}
                    >
                      <PersonAvatar
                        fullName={person.fullName}
                        photoUrl={person.photoUrl}
                        size="md"
                        hasAllergies={hasAllergies}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[oklch(0.18_0.02_160)] text-sm group-hover:text-[oklch(0.35_0.06_160)] transition-colors truncate">
                            {person.fullName}
                            {person.preferredName &&
                              person.preferredName !== person.fullName && (
                                <span className="ml-1 font-normal text-[oklch(0.55_0_0)]">
                                  ({person.preferredName})
                                </span>
                              )}
                          </span>
                          <PersonTypeBadge type={person.type} />
                          {person.status === 'archived' && (
                            <PersonStatusBadge status={person.status} />
                          )}
                          {hasAllergies && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3 w-3"
                                aria-hidden="true"
                              >
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                              </svg>
                              Allergies
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-[oklch(0.6_0_0)]">
                          {person.dateOfBirth && (
                            <span>
                              {formatDateOfBirth(person.dateOfBirth)}
                              {age !== null && (
                                <span className="ml-1 text-[oklch(0.55_0_0)]">
                                  ({age} yrs)
                                </span>
                              )}
                            </span>
                          )}
                          {person.nhsNumber && (
                            <span>
                              NHS: {person.nhsNumber}
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
                );
              })}
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
                onClick={() =>
                  updateSearch({ page: String(page - 1) })
                }
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
                onClick={() =>
                  updateSearch({ page: String(page + 1) })
                }
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
