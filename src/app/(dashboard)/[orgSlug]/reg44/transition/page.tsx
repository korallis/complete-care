import type { Metadata } from 'next';
import Link from 'next/link';
import { MILESTONE_CATEGORIES, MILESTONE_STATUSES } from '@/features/reg44';

export const metadata: Metadata = {
  title: 'Transition & Leaving Care',
};

interface TransitionPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function TransitionPage({
  params,
}: TransitionPageProps) {
  const { orgSlug } = await params;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Transition & Leaving Care
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pathway Plans for 16+ young people, transition milestones, and
            independent living skills assessments.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      {/* Milestone categories overview */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Milestone Categories</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          {MILESTONE_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="rounded-md border px-3 py-2 text-center text-sm capitalize"
            >
              {cat.replace('_', ' ')}
            </div>
          ))}
        </div>
      </div>

      {/* Milestone statuses */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Milestone Statuses</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          {MILESTONE_STATUSES.map((status) => (
            <div
              key={status}
              className="rounded-md border px-3 py-2 text-center text-sm capitalize"
            >
              {status.replace('-', ' ')}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p className="text-sm">
          No pathway plans created yet. Create a plan for a young person aged
          16+ approaching transition from care.
        </p>
        <p className="mt-2 text-xs">
          Plans cover: accommodation, education, employment, health, financial
          support, relationships, identity, and practical skills.
        </p>
      </div>
    </div>
  );
}
