'use client';

import type { MissingEpisodeTimelineEntry } from '@/lib/db/schema';

const ACTION_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  absence_noticed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Absence Noticed' },
  search_conducted: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Search Conducted' },
  police_notified: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Police Notified' },
  authority_notified: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Authority Notified' },
  ri_notified: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'RI Notified' },
  sighting_reported: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Sighting Reported' },
  child_returned: { bg: 'bg-green-100', text: 'text-green-700', label: 'Child Returned' },
  wellbeing_check: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Wellbeing Check' },
  escalation_triggered: { bg: 'bg-red-100', text: 'text-red-700', label: 'Escalation Triggered' },
  note_added: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Note Added' },
  rhi_created: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'RHI Created' },
};

/**
 * Displays the timestamped timeline for a missing episode.
 * Each step is shown with its action type badge and exact timestamp.
 */
export function MissingEpisodeTimeline({
  entries,
}: {
  entries: MissingEpisodeTimelineEntry[];
}) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500 italic">
        No timeline entries yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />

      <ol className="space-y-3">
        {entries.map((entry) => {
          const style = ACTION_TYPE_STYLES[entry.actionType] ?? {
            bg: 'bg-gray-100',
            text: 'text-gray-700',
            label: entry.actionType,
          };

          return (
            <li key={entry.id} className="relative pl-8">
              {/* Dot on the line */}
              <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-400 shadow-sm" />

              <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                  <time className="text-xs text-gray-400">
                    {entry.occurredAt.toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {entry.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
