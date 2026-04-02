'use client';

import type { DomiciliaryPortalView } from '../../types';

interface DomiciliaryCareViewProps {
  view: DomiciliaryPortalView;
  sections: { key: string; title: string; description: string }[];
}

/**
 * Domiciliary care portal view — visit schedule, recent notes, care plan summary.
 */
export function DomiciliaryCareView({
  view,
  sections,
}: DomiciliaryCareViewProps) {
  return (
    <>
      {/* Visit Schedule */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[0].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[0].description}
        </p>
        {view.visitSchedule.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming visits scheduled.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.visitSchedule.map((visit) => (
              <li
                key={visit.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{visit.carerName}</span>
                  <span className="text-muted-foreground">
                    {' '}&middot; {visit.duration} min
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {visit.scheduledAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent Visit Notes */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[1].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[1].description}
        </p>
        {view.recentVisitNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recent visit notes available.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.recentVisitNotes.map((note) => (
              <li key={note.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{note.carerName}</span>
                  <span className="text-muted-foreground">
                    {note.visitDate}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{note.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Care Plan Summary */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[2].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[2].description}
        </p>
        {!view.carePlanSummary ? (
          <p className="text-sm text-muted-foreground">
            No care plan summary available.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Plan:</span>{' '}
              {view.carePlanSummary.title}
            </p>
            <p>
              <span className="font-medium">Last review:</span>{' '}
              {view.carePlanSummary.lastReviewDate}
            </p>
            <p>
              <span className="font-medium">Next review:</span>{' '}
              {view.carePlanSummary.nextReviewDate}
            </p>
            {view.carePlanSummary.objectives.length > 0 && (
              <div>
                <span className="font-medium">Objectives:</span>
                <ul className="ml-4 mt-1 list-disc">
                  {view.carePlanSummary.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
