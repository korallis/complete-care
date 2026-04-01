/**
 * StaffEmptyState — displayed when no staff match the current filters
 * or when the organisation has no staff profiles yet.
 */

import Link from 'next/link';

type StaffEmptyStateProps = {
  orgSlug: string;
  isFiltered: boolean;
  canCreate: boolean;
};

export function StaffEmptyState({
  orgSlug,
  isFiltered,
  canCreate,
}: StaffEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-[oklch(0.45_0.07_160)]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] mb-1">
          No matching staff found
        </p>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Try adjusting your search or filters to find what you are looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-[oklch(0.45_0.07_160)]"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] mb-1">
        No staff profiles yet
      </p>
      <p className="text-sm text-[oklch(0.55_0_0)] mb-4">
        Add your first staff member to start managing your team.
      </p>
      {canCreate && (
        <Link
          href={`/${orgSlug}/staff/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.22_0.04_160)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[oklch(0.28_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2"
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
          Add staff member
        </Link>
      )}
    </div>
  );
}
