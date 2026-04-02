import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { listPersons } from '@/features/persons/actions';
import { NewConcernPageClient } from './client';

export const metadata: Metadata = {
  title: 'Record Safeguarding Concern — Complete Care',
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

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  // Fetch all young persons for the child-picker
  const personsResult = await listPersons({ pageSize: 100, status: 'active' });
  const personOptions = personsResult.persons.map((p) => ({
    id: p.id,
    name: p.fullName,
  }));

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
        childName={childName ?? ''}
        personOptions={personOptions}
      />
    </div>
  );
}
