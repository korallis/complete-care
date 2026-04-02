'use client';

/**
 * ChildrenVoiceList — displays children's wishes and feelings records.
 */

import Link from 'next/link';
import type { ChildrensVoiceEntry } from '@/lib/db/schema';
import {
  VOICE_CATEGORY_LABELS,
  VOICE_METHOD_LABELS,
  type VoiceCategory,
  type VoiceMethod,
} from '../constants';

type ChildrenVoiceListProps = {
  entries: ChildrensVoiceEntry[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  daily_life: 'bg-blue-50 text-blue-700',
  education: 'bg-indigo-50 text-indigo-700',
  health: 'bg-green-50 text-green-700',
  family_contact: 'bg-pink-50 text-pink-700',
  placement: 'bg-purple-50 text-purple-700',
  activities: 'bg-orange-50 text-orange-700',
  food: 'bg-yellow-50 text-yellow-700',
  safety: 'bg-red-50 text-red-700',
  complaints: 'bg-red-50 text-red-700',
  compliments: 'bg-green-50 text-green-700',
  wishes: 'bg-purple-50 text-purple-700',
  other: 'bg-slate-100 text-slate-700',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function VoiceCard({ entry }: { entry: ChildrensVoiceEntry }) {
  const categoryLabel =
    VOICE_CATEGORY_LABELS[entry.category as VoiceCategory] ?? entry.category;
  const methodLabel = entry.method
    ? VOICE_METHOD_LABELS[entry.method as VoiceMethod] ?? entry.method
    : null;
  const categoryColor = CATEGORY_COLORS[entry.category] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50">
          <svg
            className="h-4 w-4 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
              {categoryLabel}
            </span>
            <span className="text-xs text-[oklch(0.65_0_0)]">
              {formatDate(entry.recordedDate)}
            </span>
            {methodLabel && (
              <span className="text-xs text-[oklch(0.65_0_0)]">
                via {methodLabel}
              </span>
            )}
          </div>

          <blockquote className="text-sm text-[oklch(0.35_0.04_160)] italic border-l-2 border-purple-200 pl-3 mb-3">
            &ldquo;{entry.content}&rdquo;
          </blockquote>

          {entry.actionTaken && (
            <div className="rounded-lg bg-[oklch(0.97_0.003_160)] px-3 py-2">
              <p className="text-xs">
                <span className="font-medium text-[oklch(0.35_0.04_160)]">Action taken:</span>{' '}
                <span className="text-[oklch(0.55_0_0)]">{entry.actionTaken}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChildrenVoiceList({
  entries,
  orgSlug,
  personId,
  canCreate,
}: ChildrenVoiceListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
          <svg
            className="h-5 w-5 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          No wishes recorded
        </h3>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-4">
          Record this child&apos;s wishes, feelings, and views.
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/keyworker/voice/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            Record wishes
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <VoiceCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
