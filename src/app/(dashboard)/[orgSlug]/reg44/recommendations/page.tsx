import type { Metadata } from 'next';
import Link from 'next/link';
import {
  createReg44Recommendation,
  listReg44Recommendations,
  listReg44Reports,
  updateReg44Recommendation,
} from '@/features/reg44/actions';
import { requireReg44PageAccess } from '@/features/reg44/page-access';
import {
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_STATUSES,
  type RecommendationPriority,
  type RecommendationStatus,
} from '@/features/reg44';

export const metadata: Metadata = {
  title: 'Recommendations',
};

interface RecommendationsPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function createRecommendationAction(formData: FormData) {
  'use server';

  const result = await createReg44Recommendation({
    reportId: String(formData.get('reportId') ?? ''),
    description: String(formData.get('description') ?? ''),
    priority: String(formData.get('priority') ?? 'medium') as RecommendationPriority,
    dueDate: String(formData.get('dueDate') ?? '') || undefined,
    notes: String(formData.get('notes') ?? '') || undefined,
    status: 'open',
  });

  if (!result.success) throw new Error(result.error);
}

async function updateRecommendationStatusAction(formData: FormData) {
  'use server';

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'open') as RecommendationStatus;
  const result = await updateReg44Recommendation(id, { status });
  if (!result.success) throw new Error(result.error);
}

export default async function RecommendationsPage({
  params,
}: RecommendationsPageProps) {
  const { orgSlug } = await params;
  const access = await requireReg44PageAccess(orgSlug);
  const [recommendations, reports] = await Promise.all([
    listReg44Recommendations(),
    listReg44Reports(),
  ]);

  const statusCounts = Object.fromEntries(
    RECOMMENDATION_STATUSES.map((status) => [
      status,
      recommendations.filter((item) => item.status === status).length,
    ]),
  ) as Record<RecommendationStatus, number>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Recommendation tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track recommendations raised through Reg 44 reporting.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {RECOMMENDATION_STATUSES.map((status) => (
          <div key={status} className="rounded-xl border bg-white p-4 text-center">
            <p className="text-2xl font-semibold">{statusCounts[status]}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {status.replaceAll('-', ' ')}
            </p>
          </div>
        ))}
      </div>

      {access.canManageQuality && (
        <form
          action={createRecommendationAction}
          className="rounded-xl border bg-white p-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm sm:col-span-2">
              <span className="font-medium">Source report</span>
              <select
                required
                name="reportId"
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select report</option>
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.summary || report.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Priority</span>
              <select name="priority" className="w-full rounded-lg border px-3 py-2">
                {RECOMMENDATION_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Recommendation</span>
            <textarea
              required
              name="description"
              rows={3}
              placeholder="What needs to be completed?"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Due date</span>
              <input type="date" name="dueDate" className="w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Notes</span>
              <input
                name="notes"
                placeholder="Owner / context"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white"
          >
            Add recommendation
          </button>
        </form>
      )}

      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
            No recommendations yet. Create one from a Reg 44 report.
          </div>
        ) : (
          recommendations.map((item) => (
            <article key={item.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{item.description}</h2>
                  <p className="text-sm text-muted-foreground">
                    Report {item.reportId}
                    {item.dueDate ? ` · Due ${item.dueDate}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 capitalize">
                    {item.priority}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {item.status.replaceAll('-', ' ')}
                  </span>
                </div>
              </div>
              {item.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{item.notes}</p>
              )}
              {access.canManageQuality && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {RECOMMENDATION_STATUSES.filter((status) => status !== item.status).map(
                    (status) => (
                      <form key={status} action={updateRecommendationStatusAction}>
                        <input type="hidden" name="id" value={item.id} />
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
