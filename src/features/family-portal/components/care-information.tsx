'use client';

import { cn } from '@/lib/utils';
import type { CareInformationView } from '../types';

interface CareInformationProps {
  data: CareInformationView;
  visibleSections?: string[];
  className?: string;
}

const DEFAULT_VISIBLE_SECTIONS = [
  'care_plans',
  'care_notes',
  'medications',
  'appointments',
] as const;

/**
 * Read-only care information view for family members.
 * Displays care plans, care notes, medication summary, and appointments.
 */
export function CareInformation({
  data,
  visibleSections = [...DEFAULT_VISIBLE_SECTIONS],
  className,
}: CareInformationProps) {
  const sections = new Set(visibleSections);

  return (
    <div className={cn('space-y-6', className)}>
      {sections.has('care_plans') && (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Care Plans</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Current care plan summaries
          </p>
          {data.carePlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No care plans available.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.carePlans.map((plan) => (
                <li key={plan.id} className="rounded border p-3 text-sm">
                  <span className="font-medium">{plan.title}</span>
                  <p className="text-muted-foreground">
                    Last review: {plan.lastReviewDate} &middot; Next:{' '}
                    {plan.nextReviewDate}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {sections.has('care_notes') && (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Recent Care Notes</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Notes from recent care interactions
          </p>
          {data.recentCareNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent care notes available.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recentCareNotes.map((note) => (
                <li key={note.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{note.category}</span>
                    <span className="text-muted-foreground">{note.date}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{note.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    By {note.staffName}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {sections.has('medications') && (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Medication Summary</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Current medications and dosages
          </p>
          {data.medicationSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No medications recorded.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.medicationSummary.map((med) => (
                <li
                  key={med.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div>
                    <span className="font-medium">{med.medicationName}</span>
                    <span className="text-muted-foreground">
                      {' '}&middot; {med.dosage} &middot; {med.frequency}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Since {med.startDate}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {sections.has('appointments') && (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Upcoming Appointments</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Scheduled appointments and visits
          </p>
          {data.upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming appointments.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.upcomingAppointments.map((appt) => (
                <li
                  key={appt.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div>
                    <span className="font-medium">{appt.title}</span>
                    <span className="text-muted-foreground">
                      {' '}&middot; {appt.type} &middot; {appt.location}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {appt.scheduledAt}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
