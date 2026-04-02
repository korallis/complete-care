import type { Metadata } from 'next';
import Link from 'next/link';
import {
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_STATUSES,
} from '@/features/reg44';

export const metadata: Metadata = {
  title: 'Recommendations',
};

interface RecommendationsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function RecommendationsPage({
  params,
}: RecommendationsPageProps) {
  const { orgSlug } = await params;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Recommendation Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Outstanding recommendations from Reg 44 reports with priority and
            due date tracking.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      {/* Dashboard summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {RECOMMENDATION_STATUSES.map((status) => (
          <div key={status} className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs capitalize text-muted-foreground">
              {status.replace('-', ' ')}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {RECOMMENDATION_PRIORITIES.map((priority) => (
          <div key={priority} className="rounded-md border p-3 text-center">
            <p className="text-lg font-semibold">0</p>
            <p className="text-xs capitalize text-muted-foreground">
              {priority} priority
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p className="text-sm">
          No recommendations yet. Recommendations are created from Reg 44
          reports.
        </p>
      </div>
    </div>
  );
}
