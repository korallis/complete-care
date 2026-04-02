import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MASH Referrals',
};

interface MashPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function MashPage({ params }: MashPageProps) {
  const { orgSlug } = await params;
  void orgSlug;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">MASH Referrals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Multi-Agency Safeguarding Hub referral tracking with reference numbers
          and outcomes.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          MASH referral list will display once authentication is configured.
        </p>
      </div>
    </div>
  );
}
