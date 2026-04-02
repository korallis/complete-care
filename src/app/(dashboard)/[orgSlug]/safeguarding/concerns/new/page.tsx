import type { Metadata } from 'next';
import { NewConcernPageClient } from './client';

export const metadata: Metadata = {
  title: 'Record Safeguarding Concern',
};

interface NewConcernPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ childId?: string; childName?: string }>;
}

export default async function NewConcernPage({
  params,
  searchParams,
}: NewConcernPageProps) {
  const { orgSlug } = await params;
  const { childId, childName } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">
          Record Safeguarding Concern
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete this form to raise a safeguarding concern. This record will
          be immutable after submission.
        </p>
      </div>
      <NewConcernPageClient
        orgSlug={orgSlug}
        childId={childId ?? ''}
        childName={childName ?? 'Unknown Child'}
      />
    </div>
  );
}
