'use client';

import type { ComplexCarePortalView } from '../../types';

interface ComplexCareViewProps {
  view: ComplexCarePortalView;
  sections: { key: string; title: string; description: string }[];
}

const ALERT_BADGE_STYLES = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-rose-100 text-rose-800',
} as const;

const CONTINUITY_BADGE_STYLES = {
  stable: 'bg-emerald-100 text-emerald-800',
  watch: 'bg-amber-100 text-amber-800',
  urgent: 'bg-rose-100 text-rose-800',
} as const;

/**
 * Complex care portal view — clinical alerts, staffing continuity, protocol highlights.
 */
export function ComplexCareView({ view, sections }: ComplexCareViewProps) {
  return (
    <>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[0].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[0].description}
        </p>
        {view.clinicalAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No clinical alerts shared with family yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.clinicalAlerts.map((alert) => (
              <li key={alert.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{alert.title}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${ALERT_BADGE_STYLES[alert.severity]}`}
                  >
                    {alert.severity} · {alert.status}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{alert.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {alert.updatedAt}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[1].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[1].description}
        </p>
        {view.staffingContinuity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No continuity updates available yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.staffingContinuity.map((entry) => (
              <li key={entry.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{entry.staffName}</p>
                    <p className="text-muted-foreground">{entry.role}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${CONTINUITY_BADGE_STYLES[entry.continuityStatus]}`}
                  >
                    {entry.continuityStatus}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{entry.notes}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Next check-in: {entry.nextCheckIn}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[2].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[2].description}
        </p>
        {view.protocolHighlights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No protocol highlights shared yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.protocolHighlights.map((protocol) => (
              <li key={protocol.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{protocol.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Reviewed {protocol.lastReviewed}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{protocol.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Owner: {protocol.owner}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
