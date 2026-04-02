'use client';

import type { ChildrensHomesPortalView } from '../../types';

interface ChildrensHomesViewProps {
  view: ChildrensHomesPortalView;
  sections: { key: string; title: string; description: string }[];
}

/**
 * Children's homes portal view — key worker sessions, contact schedule, daily logs.
 */
export function ChildrensHomesView({
  view,
  sections,
}: ChildrensHomesViewProps) {
  return (
    <>
      {/* Key Worker Sessions */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[0].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[0].description}
        </p>
        {view.keyWorkerSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No key worker sessions recorded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.keyWorkerSessions.map((session) => (
              <li key={session.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{session.keyWorkerName}</span>
                  <span className="text-muted-foreground">
                    {session.sessionDate}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{session.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Next session: {session.nextSessionDate}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contact Schedule */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[1].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[1].description}
        </p>
        {view.contactSchedule.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No contacts scheduled.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.contactSchedule.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{contact.contactName}</span>
                  <span className="text-muted-foreground">
                    {' '}&middot; {contact.relationship} &middot;{' '}
                    {contact.contactType}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {contact.scheduledAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Daily Log Highlights */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[2].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[2].description}
        </p>
        {view.dailyLogHighlights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No daily log highlights available.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.dailyLogHighlights.map((log) => (
              <li key={log.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.date}</span>
                  <span className="text-muted-foreground">
                    Mood: {log.mood}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{log.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recorded by {log.staffName}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
