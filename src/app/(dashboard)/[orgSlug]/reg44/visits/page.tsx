import type { Metadata } from 'next';
import Link from 'next/link';
import {
  createReg44Visit,
  listReg44Visits,
  updateReg44Visit,
} from '@/features/reg44/actions';
import { requireReg44PageAccess } from '@/features/reg44/page-access';
import { VISIT_STATUSES, type VisitStatus } from '@/features/reg44';

export const metadata: Metadata = {
  title: 'Reg 44 Monthly Visits',
};

interface VisitsPageProps {
  params: Promise<{ orgSlug: string }>;
}

function splitLines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function createVisitAction(formData: FormData) {
  'use server';

  const result = await createReg44Visit({
    visitDate: String(formData.get('visitDate') ?? ''),
    visitorName: String(formData.get('visitorName') ?? ''),
    childrenSpokenTo: splitLines(formData.get('childrenSpokenTo')),
    staffSpokenTo: splitLines(formData.get('staffSpokenTo')),
    recordsReviewed: splitLines(formData.get('recordsReviewed')),
    areasInspected: splitLines(formData.get('areasInspected')),
    status: 'scheduled',
  });

  if (!result.success) throw new Error(result.error);
}

async function updateVisitStatusAction(formData: FormData) {
  'use server';

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'scheduled') as VisitStatus;
  const result = await updateReg44Visit(id, { status });
  if (!result.success) throw new Error(result.error);
}

export default async function VisitsPage({ params }: VisitsPageProps) {
  const { orgSlug } = await params;
  const access = await requireReg44PageAccess(orgSlug);
  const visits = await listReg44Visits();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monthly visits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule and evidence independent Reg 44 monitoring visits.
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
          action={createVisitAction}
          className="rounded-xl border bg-white p-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Visit date</span>
              <input
                required
                type="date"
                name="visitDate"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Independent visitor</span>
              <input
                required
                name="visitorName"
                placeholder="Jane Smith"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Children spoken to</span>
              <textarea
                name="childrenSpokenTo"
                rows={3}
                placeholder="One per line"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Staff spoken to</span>
              <textarea
                name="staffSpokenTo"
                rows={3}
                placeholder="One per line"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Records reviewed</span>
              <textarea
                name="recordsReviewed"
                rows={3}
                placeholder="Daily logs, sanctions, restraints…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Areas inspected</span>
              <textarea
                name="areasInspected"
                rows={3}
                placeholder="Kitchen, bedrooms, records room…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white"
          >
            Schedule visit
          </button>
        </form>
      )}

      <div className="space-y-4">
        {visits.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
            No visits recorded yet. Create your first monthly monitoring visit.
          </div>
        ) : (
          visits.map((visit) => (
            <article key={visit.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{visit.visitorName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Visit date {String(visit.visitDate)}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                  {visit.status.replaceAll('-', ' ')}
                </span>
              </div>
              <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="font-medium">Children spoken to</p>
                  <p className="text-muted-foreground">
                    {visit.childrenSpokenTo.length
                      ? visit.childrenSpokenTo.join(', ')
                      : 'No names logged'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Staff spoken to</p>
                  <p className="text-muted-foreground">
                    {visit.staffSpokenTo.length
                      ? visit.staffSpokenTo.join(', ')
                      : 'No names logged'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Records reviewed</p>
                  <p className="text-muted-foreground">
                    {visit.recordsReviewed.length
                      ? visit.recordsReviewed.join(', ')
                      : 'No records logged'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Areas inspected</p>
                  <p className="text-muted-foreground">
                    {visit.areasInspected.length
                      ? visit.areasInspected.join(', ')
                      : 'No areas logged'}
                  </p>
                </div>
              </div>

              {access.canManageQuality && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {VISIT_STATUSES.filter((status) => status !== visit.status).map(
                    (status) => (
                      <form key={status} action={updateVisitStatusAction}>
                        <input type="hidden" name="id" value={visit.id} />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          className="rounded-md border px-3 py-1 text-xs font-medium"
                        >
                          Mark {status.replaceAll('-', ' ')}
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
