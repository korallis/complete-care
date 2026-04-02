'use client';

/**
 * SanctionList — displays sanctions log for a child.
 * Highlights prohibited measures in red for regulatory safeguarding.
 */

import Link from 'next/link';
import type { Sanction } from '@/lib/db/schema';
import {
  SANCTION_TYPE_LABELS,
  type SanctionType,
} from '../constants';

type SanctionListProps = {
  sanctions: Sanction[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SanctionCard({ sanction }: { sanction: Sanction }) {
  const typeLabel =
    SANCTION_TYPE_LABELS[sanction.sanctionType as SanctionType] ??
    sanction.sanctionType;

  return (
    <div
      className={`rounded-xl border p-5 ${
        sanction.isProhibited
          ? 'border-red-300 bg-red-50'
          : 'border-[oklch(0.91_0.005_160)] bg-white'
      }`}
    >
      {sanction.isProhibited && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2">
          <svg
            className="h-4 w-4 text-red-700 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-xs font-medium text-red-800">
            ⚠ Prohibited measure — this sanction is not permitted under the Children&apos;s Homes
            (England) Regulations 2015
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-sm font-semibold ${
                sanction.isProhibited ? 'text-red-800' : 'text-[oklch(0.22_0.04_160)]'
              }`}
            >
              {typeLabel}
            </span>
            <span className="text-xs text-[oklch(0.65_0_0)]">
              {formatDateTime(sanction.dateTime)}
            </span>
          </div>
          <p className="text-sm text-[oklch(0.45_0.02_160)] line-clamp-3 mb-3">
            {sanction.description}
          </p>
          {sanction.justification && (
            <div className="mb-3 rounded-lg bg-[oklch(0.97_0.003_160)] px-3 py-2">
              <p className="text-xs text-[oklch(0.55_0_0)]">
                <span className="font-medium">Justification:</span>{' '}
                {sanction.justification}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {sanction.reviewedById ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                Reviewed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Awaiting review
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SanctionList({
  sanctions,
  orgSlug,
  personId,
  canCreate,
}: SanctionListProps) {
  if (sanctions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
          <svg
            className="h-5 w-5 text-[oklch(0.45_0.07_160)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          No sanctions recorded
        </h3>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-4">
          No sanctions have been logged for this child.
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/keyworker/sanctions/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            Log sanction
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sanctions.map((s) => (
        <SanctionCard key={s.id} sanction={s} />
      ))}
    </div>
  );
}
