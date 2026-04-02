import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getOpenConcerns } from '@/features/safeguarding/actions';
import { DSL_REVIEW_ROLES } from '@/features/safeguarding/constants';
import { DslReviewClient } from './dsl-review-client';
import type { SafeguardingConcern } from '@/lib/db/schema/safeguarding';

export const metadata: Metadata = {
  title: 'DSL Review Dashboard — Complete Care',
};

interface DslReviewPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function DslReviewPage({ params }: DslReviewPageProps) {
  const { orgSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  // Fetch open concerns — action enforces DSL-role RBAC internally
  const result = await getOpenConcerns();
  const concerns = result.success
    ? (result.data as SafeguardingConcern[])
    : [];

  const isDslReviewer = (DSL_REVIEW_ROLES as readonly string[]).includes(
    session.user.role ?? '',
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              DSL Review Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review open safeguarding concerns and record decisions. Select a
              concern to make a decision: internal monitoring, MASH referral,
              LADO referral, or police referral.
            </p>
          </div>
          <Link
            href={`/${orgSlug}/safeguarding/concerns/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Record concern
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-red-800 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            {concerns.length} open concern{concerns.length !== 1 ? 's' : ''}
          </span>
          {!isDslReviewer && (
            <span className="text-muted-foreground text-xs">
              DSL review decisions require DSL or senior leadership role.
            </span>
          )}
        </div>
      </div>

      <DslReviewClient concerns={concerns} />
    </div>
  );
}
