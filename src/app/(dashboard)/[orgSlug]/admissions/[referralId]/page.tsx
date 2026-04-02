import { notFound } from 'next/navigation';
import { getReferral } from '@/features/admissions/actions';
import { ReferralDetail } from '@/features/admissions/components/referral-detail';

export const metadata = { title: 'Referral Detail' };

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ referralId: string }>;
}) {
  const { referralId } = await params;

  let data;
  try {
    data = await getReferral(referralId);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-8">
      <ReferralDetail
        referral={data.referral}
        transitions={data.transitions}
        assessments={data.assessments}
        checklist={data.checklist}
      />
    </div>
  );
}
