import type { Metadata } from 'next';
import Link from 'next/link';
import {
  createReg40NotifiableEvent,
  listReg40NotifiableEvents,
  updateReg40NotifiableEvent,
} from '@/features/reg44/actions';
import { requireReg44PageAccess } from '@/features/reg44/page-access';
import {
  EVENT_STATUSES,
  NOTIFIABLE_EVENT_CATEGORIES,
  NOTIFIABLE_EVENT_CATEGORY_LABELS,
  type EventStatus,
  type NotifiableEventCategoryType,
} from '@/features/reg44';

export const metadata: Metadata = {
  title: 'Notifiable Events (Reg 40)',
};

interface NotifiableEventsPageProps {
  params: Promise<{ orgSlug: string }>;
}

function splitLines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function createNotifiableEventAction(formData: FormData) {
  'use server';

  const result = await createReg40NotifiableEvent({
    category: String(
      formData.get('category') ?? 'other',
    ) as NotifiableEventCategoryType,
    eventDate: String(formData.get('eventDate') ?? ''),
    description: String(formData.get('description') ?? ''),
    childrenInvolved: splitLines(formData.get('childrenInvolved')),
    staffInvolved: splitLines(formData.get('staffInvolved')),
    notificationDate: String(formData.get('notificationDate') ?? '') || undefined,
    ofstedReference: String(formData.get('ofstedReference') ?? '') || undefined,
    notificationMethod:
      String(formData.get('notificationMethod') ?? '') || undefined,
    actionsTaken: String(formData.get('actionsTaken') ?? '') || undefined,
    outcome: String(formData.get('outcome') ?? '') || undefined,
    status: 'draft',
  });

  if (!result.success) throw new Error(result.error);
}

async function updateNotifiableEventStatusAction(formData: FormData) {
  'use server';

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'draft') as EventStatus;
  const result = await updateReg40NotifiableEvent(id, { status });
  if (!result.success) throw new Error(result.error);
}

export default async function NotifiableEventsPage({
  params,
}: NotifiableEventsPageProps) {
  const { orgSlug } = await params;
  const access = await requireReg44PageAccess(orgSlug);
  const events = await listReg40NotifiableEvents();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Notifiable events (Regulation 40)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record events that must be reported to Ofsted and track notification
            progress.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      {access.canManageQuality && (
        <form
          action={createNotifiableEventAction}
          className="rounded-xl border bg-white p-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Category</span>
              <select name="category" className="w-full rounded-lg border px-3 py-2">
                {NOTIFIABLE_EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {NOTIFIABLE_EVENT_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Event date</span>
              <input
                required
                type="date"
                name="eventDate"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Notification date</span>
              <input
                type="date"
                name="notificationDate"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Description</span>
            <textarea
              required
              name="description"
              rows={3}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Children involved</span>
              <textarea
                name="childrenInvolved"
                rows={3}
                placeholder="One per line"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Staff involved</span>
              <textarea
                name="staffInvolved"
                rows={3}
                placeholder="One per line"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Ofsted reference</span>
              <input name="ofstedReference" className="w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Notification method</span>
              <input name="notificationMethod" className="w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Outcome</span>
              <input name="outcome" className="w-full rounded-lg border px-3 py-2" />
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Actions taken</span>
            <textarea
              name="actionsTaken"
              rows={2}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white"
          >
            Record event
          </button>
        </form>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
            No notifiable events recorded yet.
          </div>
        ) : (
          events.map((event) => (
            <article key={event.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {NOTIFIABLE_EVENT_CATEGORY_LABELS[event.category]}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {String(event.eventDate)}
                    {event.ofstedReference ? ` · Ref ${event.ofstedReference}` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                  {event.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-foreground/80">{event.description}</p>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="font-medium">Children involved</p>
                  <p className="text-muted-foreground">
                    {event.childrenInvolved.length
                      ? event.childrenInvolved.join(', ')
                      : 'No children recorded'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Staff involved</p>
                  <p className="text-muted-foreground">
                    {event.staffInvolved.length
                      ? event.staffInvolved.join(', ')
                      : 'No staff recorded'}
                  </p>
                </div>
              </div>
              {event.actionsTaken && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Actions taken: {event.actionsTaken}
                </p>
              )}
              {access.canManageQuality && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {EVENT_STATUSES.filter((status) => status !== event.status).map(
                    (status) => (
                      <form key={status} action={updateNotifiableEventStatusAction}>
                        <input type="hidden" name="id" value={event.id} />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          className="rounded-md border px-3 py-1 text-xs font-medium"
                        >
                          Mark {status}
                        </button>
                      </form>
                    ),
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
