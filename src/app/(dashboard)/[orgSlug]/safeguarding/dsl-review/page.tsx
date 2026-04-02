import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DSL Review Dashboard',
};

interface DslReviewPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function DslReviewPage({ params }: DslReviewPageProps) {
  const { orgSlug } = await params;
  void orgSlug; // Used for tenant-scoped data fetching once auth is integrated

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">
          DSL Review Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review open safeguarding concerns and record decisions. Four decision
          pathways: Internal monitoring, MASH referral, LADO referral, or Police
          referral.
        </p>
      </div>
      {/*
        In production, this would fetch open concerns via getOpenConcerns()
        and render a ConcernList with a DslReviewForm in a detail panel.
        Placeholder for server-side data fetching once auth is integrated.
      */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          DSL Review Dashboard will display open concerns once authentication is
          configured. Use server action <code>getOpenConcerns()</code> to fetch
          data.
        </p>
      </div>
    </div>
  );
}
