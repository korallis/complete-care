import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { listReferrals } from '@/features/admissions/actions';
import { ReferralsTable } from '@/features/admissions/components/referrals-table';

export const metadata = { title: 'Admissions' };

export default async function AdmissionsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const referrals = await listReferrals();

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admissions &amp; referrals
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage incoming referrals, matching assessments, and admission
            workflows.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/admissions/new`}>New referral</Link>
        </Button>
      </div>

      <ReferralsTable referrals={referrals} orgSlug={orgSlug} />
    </div>
  );
}
