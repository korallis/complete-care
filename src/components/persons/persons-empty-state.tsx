/**
 * PersonsEmptyState — shown when an org has no person records.
 */
import Link from 'next/link';
import type { PersonTerminology } from '@/features/persons/utils';

type PersonsEmptyStateProps = {
  orgSlug: string;
  terminology: PersonTerminology;
  /** True when showing filtered results with no matches */
  isFiltered?: boolean;
  canCreate?: boolean;
};

export function PersonsEmptyState({
  orgSlug,
  terminology,
  isFiltered = false,
  canCreate = true,
}: PersonsEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="rounded-2xl border border-dashed border-[oklch(0.85_0.01_160)] bg-[oklch(0.98_0.003_160)] p-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-[oklch(0.91_0.005_160)] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-[oklch(0.55_0_0)]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
          No results found
        </h3>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-[oklch(0.85_0.01_160)] bg-[oklch(0.98_0.003_160)] p-16 text-center">
      <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="oklch(0.22 0.04 160)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
        No {terminology.pluralLower} yet
      </h3>
      <p className="mt-2 text-sm text-[oklch(0.55_0_0)] max-w-sm mx-auto leading-relaxed">
        Add your first {terminology.singularLower} to start managing their care, 
        notes, assessments, and documents in one place.
      </p>
      {canCreate && (
        <div className="mt-6">
          <Link
            href={`/${orgSlug}/persons/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.22_0.04_160)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[oklch(0.28_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2"
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
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add {terminology.singular}
          </Link>
        </div>
      )}
    </div>
  );
}
