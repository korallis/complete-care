'use client';

import { useState } from 'react';
import type { SopStatus } from '../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatementVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  status: SopStatus;
  createdBy: string;
  nextReviewDate: string | null;
  publishedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_VERSIONS: StatementVersion[] = [
  {
    id: '3',
    version: 3,
    title: 'Statement of Purpose — Oakwood House',
    content:
      'Oakwood House provides a safe, nurturing residential environment for up to six young people aged 11-17. Our mission is to support each child in developing the confidence, skills and resilience they need to thrive. We employ a trauma-informed, relationship-based approach to care, with each young person receiving a tailored placement plan aligned to their individual needs and goals. Staff are trained in therapeutic crisis intervention and restorative practices. We maintain strong links with local schools, CAMHS, and the wider community to ensure a holistic support network.',
    status: 'published',
    createdBy: 'Sarah Thompson',
    nextReviewDate: '2026-09-15',
    publishedAt: '2025-09-20',
    createdAt: '2025-09-18',
  },
  {
    id: '2',
    version: 2,
    title: 'Statement of Purpose — Oakwood House',
    content:
      'Oakwood House provides a safe residential environment for up to six young people aged 11-17. Our mission is to support each child in developing the confidence and skills they need. We employ a relationship-based approach to care.',
    status: 'archived',
    createdBy: 'Sarah Thompson',
    nextReviewDate: '2025-09-15',
    publishedAt: '2024-09-20',
    createdAt: '2024-09-15',
  },
  {
    id: '1',
    version: 1,
    title: 'Statement of Purpose — Oakwood House',
    content:
      'Oakwood House is a residential children\'s home for up to six young people. We aim to provide a safe and supportive environment.',
    status: 'archived',
    createdBy: 'James Wilson',
    nextReviewDate: '2024-09-15',
    publishedAt: '2023-09-01',
    createdAt: '2023-08-28',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: SopStatus }) {
  const styles: Record<SopStatus, string> = {
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    archived: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function daysUntilReview(reviewDate: string | null): number | null {
  if (!reviewDate) return null;
  const diff = new Date(reviewDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StatementOfPurpose() {
  const [selectedVersion, setSelectedVersion] = useState<StatementVersion>(
    DEMO_VERSIONS[0],
  );

  const currentPublished = DEMO_VERSIONS.find((v) => v.status === 'published');
  const daysLeft = daysUntilReview(currentPublished?.nextReviewDate ?? null);

  return (
    <div className="space-y-6">
      {/* Review reminder banner */}
      {daysLeft !== null && daysLeft <= 90 && (
        <div
          className={`rounded-xl border px-5 py-4 ${
            daysLeft <= 30
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          <p className="text-sm font-medium">
            Annual review {daysLeft <= 0 ? 'is overdue' : `due in ${daysLeft} days`}
          </p>
          <p className="mt-0.5 text-xs opacity-75">
            The Statement of Purpose must be reviewed at least annually under
            Regulation 16 of the Children&apos;s Homes Regulations 2015.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Version list */}
        <div className="space-y-2 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Version History
          </h3>
          {DEMO_VERSIONS.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVersion(v)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                selectedVersion.id === v.id
                  ? 'border-indigo-200 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  v{v.version}
                </span>
                <StatusBadge status={v.status} />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {v.createdBy} &middot; {v.createdAt}
              </p>
            </button>
          ))}
        </div>

        {/* Document view */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    {selectedVersion.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Version {selectedVersion.version} &middot; Created{' '}
                    {selectedVersion.createdAt}
                    {selectedVersion.publishedAt &&
                      ` &middot; Published ${selectedVersion.publishedAt}`}
                  </p>
                </div>
                <StatusBadge status={selectedVersion.status} />
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {selectedVersion.content}
              </p>
            </div>
            {selectedVersion.nextReviewDate && (
              <div className="border-t border-slate-100 px-6 py-3">
                <p className="text-xs text-slate-400">
                  Next annual review:{' '}
                  <span className="font-medium text-slate-600">
                    {selectedVersion.nextReviewDate}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
