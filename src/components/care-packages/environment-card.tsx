'use client';

/**
 * EnvironmentCard — displays client environment information.
 * keySafeCode is only shown to assigned carers (controlled by canViewKeySafe prop).
 */

import { useState } from 'react';
import type { EnvironmentNotes } from '@/lib/db/schema/care-packages';

type EnvironmentCardProps = {
  environmentNotes: EnvironmentNotes;
  canViewKeySafe: boolean;
};

export function EnvironmentCard({
  environmentNotes,
  canViewKeySafe,
}: EnvironmentCardProps) {
  const [keySafeRevealed, setKeySafeRevealed] = useState(false);
  const hasAnyNotes =
    environmentNotes.keySafeCode ||
    environmentNotes.entryInstructions ||
    environmentNotes.hazards ||
    environmentNotes.parking;

  if (!hasAnyNotes) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-6 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No environment information recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-[oklch(0.95_0.003_160)] bg-[oklch(0.985_0.003_160)]">
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
          Client environment
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {/* Key safe code */}
        {environmentNotes.keySafeCode && (
          <div>
            <dt className="text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1">
              Key safe code
            </dt>
            <dd className="text-sm text-[oklch(0.22_0.04_160)]">
              {canViewKeySafe ? (
                keySafeRevealed ? (
                  <span className="font-mono bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                    {environmentNotes.keySafeCode}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setKeySafeRevealed(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-[oklch(0.88_0.005_160)] bg-white px-2.5 py-1 text-xs font-medium text-[oklch(0.35_0.06_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Reveal code
                  </button>
                )
              ) : (
                <span className="text-xs text-[oklch(0.6_0_0)] italic">
                  Only visible to assigned carers
                </span>
              )}
            </dd>
          </div>
        )}

        {/* Entry instructions */}
        {environmentNotes.entryInstructions && (
          <div>
            <dt className="text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1">
              Entry instructions
            </dt>
            <dd className="text-sm text-[oklch(0.22_0.04_160)] whitespace-pre-wrap">
              {environmentNotes.entryInstructions}
            </dd>
          </div>
        )}

        {/* Hazards */}
        {environmentNotes.hazards && (
          <div>
            <dt className="text-xs font-medium text-red-600 mb-1">
              Hazard notes
            </dt>
            <dd className="text-sm text-[oklch(0.22_0.04_160)] whitespace-pre-wrap rounded-lg border border-red-100 bg-red-50 px-3 py-2">
              {environmentNotes.hazards}
            </dd>
          </div>
        )}

        {/* Parking */}
        {environmentNotes.parking && (
          <div>
            <dt className="text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1">
              Parking information
            </dt>
            <dd className="text-sm text-[oklch(0.22_0.04_160)] whitespace-pre-wrap">
              {environmentNotes.parking}
            </dd>
          </div>
        )}
      </div>
    </div>
  );
}
