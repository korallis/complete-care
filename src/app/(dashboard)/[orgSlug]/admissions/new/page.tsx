import { ReferralForm } from '@/features/admissions/components/referral-form';

export const metadata = { title: 'New Referral' };

export default function NewReferralPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New referral
        </h1>
        <p className="text-sm text-muted-foreground">
          Record a new referral from a placing authority. The referral will
          start in &ldquo;Received&rdquo; status.
        </p>
      </div>

      <ReferralForm />
    </div>
  );
}
