import { TimelineEntryComponent } from './timeline-entry';
import type { TimelineEntry } from '@/features/person-dashboard/types';

type UnifiedTimelineProps = {
  entries: TimelineEntry[];
  emptyMessage?: string;
};

export function UnifiedTimeline({
  entries,
  emptyMessage = 'No activity recorded yet.',
}: UnifiedTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <div role="list" aria-label="Activity timeline">
        {entries.map((entry) => (
          <div key={`${entry.type}-${entry.id}`} role="listitem">
            <TimelineEntryComponent entry={entry} />
          </div>
        ))}
      </div>
    </div>
  );
}
