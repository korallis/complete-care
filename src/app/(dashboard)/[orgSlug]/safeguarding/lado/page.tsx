import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getLadoReferrals } from '@/features/safeguarding/actions';
import { LADO_ACCESS_ROLES } from '@/features/safeguarding/constants';
import { LadoClient } from './lado-client';
import type { LadoReferral } from '@/lib/db/schema/safeguarding';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LADO Referrals — Complete Care',
};

interface LadoPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function LadoPage({ params }: LadoPageProps) {
  const { orgSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const userRole = session.user.role ?? '';
  const hasLadoAccess = (LADO_ACCESS_ROLES as readonly string[]).includes(userRole);

  if (!hasLadoAccess) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const result = await getLadoReferrals();
  const referrals = result.success ? (result.data as LadoReferral[]) : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Lock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">LADO Referrals</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Restricted-access records for allegations against staff. Only Designated
              Safeguarding Lead and senior leadership have access to these records.
            </p>
          </div>
        </div>

        {/* Restricted access notice */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
          <Lock className="mt-0.5 h-4 w-4 text-orange-600 shrink-0" />
          <p className="text-xs text-orange-800">
            <strong>Restricted access.</strong> These records are not visible to the subject of the
            allegation or general staff. Access is logged for audit purposes.
          </p>
        </div>
      </div>

      <LadoClient referrals={referrals} />
    </div>
  );
}
