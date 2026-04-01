import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { getUnifiedTimeline } from '@/features/person-dashboard/actions';
import { UnifiedTimeline } from '@/components/person-dashboard/unified-timeline';
import { Badge } from '@/components/ui/badge';

interface TimelinePageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: TimelinePageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Timeline — Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Timeline - ${person.fullName} — Complete Care`
      : 'Timeline — Complete Care',
  };
}

const TYPE_FILTERS = [
  { value: 'care_note', label: 'Care Notes' },
  { value: 'care_plan', label: 'Care Plans' },
  { value: 'risk_assessment', label: 'Risk Assessments' },
  { value: 'incident', label: 'Incidents' },
  { value: 'document', label: 'Documents' },
];

export default async function TimelinePage({
  params,
  searchParams,
}: TimelinePageProps) {
  const { orgSlug, personId } = await params;
  const sp = await searchParams;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Parse search params
  const page = Math.max(1, parseInt(String(sp.page ?? '1'), 10) || 1);
  const dateFrom = typeof sp.dateFrom === 'string' ? sp.dateFrom : undefined;
  const dateTo = typeof sp.dateTo === 'string' ? sp.dateTo : undefined;
  const typesParam = typeof sp.types === 'string' ? sp.types.split(',').filter(Boolean) : undefined;

  const timeline = await getUnifiedTimeline({
    personId,
    page,
    pageSize: 20,
    dateFrom,
    dateTo,
    types: typesParam,
  });

  const basePath = `/${orgSlug}/persons/${personId}/timeline`;

  // Build URL with current filters
  function buildUrl(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    const vals = {
      page: String(page),
      dateFrom: dateFrom ?? '',
      dateTo: dateTo ?? '',
      types: typesParam?.join(',') ?? '',
      ...overrides,
    };
    for (const [k, v] of Object.entries(vals)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date range */}
          <form
            action={basePath}
            method="get"
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label
                htmlFor="dateFrom"
                className="block text-xs font-medium text-[oklch(0.55_0_0)] mb-1"
              >
                From
              </label>
              <input
                type="date"
                id="dateFrom"
                name="dateFrom"
                defaultValue={dateFrom}
                className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="dateTo"
                className="block text-xs font-medium text-[oklch(0.55_0_0)] mb-1"
              >
                To
              </label>
              <input
                type="date"
                id="dateTo"
                name="dateTo"
                defaultValue={dateTo}
                className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-1.5 text-sm"
              />
            </div>
            {typesParam && typesParam.length > 0 && (
              <input type="hidden" name="types" value={typesParam.join(',')} />
            )}
            <button
              type="submit"
              className="rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors"
            >
              Filter
            </button>
            {(dateFrom || dateTo) && (
              <Link
                href={buildUrl({ dateFrom: undefined, dateTo: undefined, page: undefined })}
                className="text-xs text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)] transition-colors"
              >
                Clear dates
              </Link>
            )}
          </form>

          {/* Type filter badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            <span className="text-xs text-[oklch(0.55_0_0)] mr-1">Types:</span>
            {TYPE_FILTERS.map((tf) => {
              const isActive = !typesParam || typesParam.includes(tf.value);
              const newTypes = typesParam
                ? isActive
                  ? typesParam.filter((t) => t !== tf.value)
                  : [...typesParam, tf.value]
                : TYPE_FILTERS.filter((t) => t.value !== tf.value).map((t) => t.value);
              return (
                <Link
                  key={tf.value}
                  href={buildUrl({
                    types: newTypes.length === TYPE_FILTERS.length || newTypes.length === 0
                      ? undefined
                      : newTypes.join(','),
                    page: undefined,
                  })}
                >
                  <Badge
                    variant={isActive ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px]"
                  >
                    {tf.label}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-[oklch(0.55_0_0)]">
        Showing {timeline.entries.length} of {timeline.totalCount} activities
        {timeline.totalPages > 1 && ` (page ${timeline.page} of ${timeline.totalPages})`}
      </p>

      {/* Timeline */}
      <UnifiedTimeline
        entries={timeline.entries}
        emptyMessage="No activity matches your filters."
      />

      {/* Pagination */}
      {timeline.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link
              href={buildUrl({ page: String(page - 1) })}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-1.5 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-[oklch(0.55_0_0)]">
            Page {page} of {timeline.totalPages}
          </span>
          {page < timeline.totalPages && (
            <Link
              href={buildUrl({ page: String(page + 1) })}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-1.5 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
