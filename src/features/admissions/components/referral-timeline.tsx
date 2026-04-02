'use client';

import type { ReferralTransition } from '@/lib/db/schema/admissions';

interface ReferralTimelineProps {
  transitions: ReferralTransition[];
}

const STATUS_LABELS: Record<string, string> = {
  none: 'None',
  received: 'Received',
  assessment_complete: 'Assessment Complete',
  accepted: 'Accepted',
  declined: 'Declined',
  admitted: 'Admitted',
};

export function ReferralTimeline({ transitions }: ReferralTimelineProps) {
  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No transitions recorded.</p>
    );
  }

  return (
    <div className="space-y-4">
      {transitions.map((t, i) => (
        <div key={t.id} className="relative flex gap-4 pb-4">
          {/* Vertical line connector */}
          {i < transitions.length - 1 && (
            <div className="absolute left-[9px] top-5 h-full w-px bg-border" />
          )}
          {/* Dot */}
          <div className="relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 border-primary bg-background" />
          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {STATUS_LABELS[t.fromStatus] ?? t.fromStatus}{' '}
              <span className="text-muted-foreground">&rarr;</span>{' '}
              {STATUS_LABELS[t.toStatus] ?? t.toStatus}
            </p>
            {t.notes && (
              <p className="mt-0.5 text-sm text-muted-foreground">{t.notes}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {t.createdAt
                ? new Date(t.createdAt).toLocaleString('en-GB')
                : '-'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
