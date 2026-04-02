import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getSection47Records } from '@/features/safeguarding/actions';
import { Section47Client } from './section47-client';
import type { Section47Investigation } from '@/lib/db/schema/safeguarding';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Section 47 Investigations — Complete Care',
};

interface Section47PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function Section47Page({ params }: Section47PageProps) {
  await params; // validate params exist

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const result = await getSection47Records();
  const investigations = result.success
    ? (result.data as Section47Investigation[])
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Section 47 Investigations
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Children Act 1989 Section 47 enquiry cooperation tracking. Record strategy
              meetings, attendees, decisions, and outcomes.
            </p>
          </div>
        </div>
      </div>

      <Section47Client investigations={investigations} />
    </div>
  );
}
