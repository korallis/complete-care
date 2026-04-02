'use client';

/**
 * SessionList — displays keyworker sessions for a child.
 */

import Link from 'next/link';
import type { KeyworkerSession } from '@/lib/db/schema';

type SessionListProps = {
  sessions: KeyworkerSession[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function SessionCard({
  session,
}: {
  session: KeyworkerSession;
}) {
  const actionCount = Array.isArray(session.actions) ? session.actions.length : 0;
  const pendingActions = Array.isArray(session.actions)
    ? session.actions.filter((a) => !a.completed).length
    : 0;

  return (
    <div className="group rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.6_0.06_160)] hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)] flex-shrink-0">
              <svg
                className="h-4 w-4 text-[oklch(0.45_0.07_160)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                Key Worker Session
              </p>
              <p className="text-xs text-[oklch(0.55_0_0)]">
                {formatDate(session.sessionDate)}
              </p>
            </div>
          </div>

          {session.checkIn && (
            <p className="text-sm text-[oklch(0.45_0.02_160)] line-clamp-2 mb-3">
              {session.checkIn}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {actionCount > 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  pendingActions > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {pendingActions > 0 ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {pendingActions} action{pendingActions !== 1 ? 's' : ''} pending
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {actionCount} action{actionCount !== 1 ? 's' : ''} complete
                  </>
                )}
              </span>
            )}
            {session.wishesAndFeelings && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                Wishes recorded
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SessionList({
  sessions,
  orgSlug,
  personId,
  canCreate,
}: SessionListProps) {
  if (sessions.length === 0) {
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
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          No sessions yet
        </h3>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-4">
          Record the first key worker session for this child.
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/keyworker/sessions/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            Record session
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
        />
      ))}
    </div>
  );
}
