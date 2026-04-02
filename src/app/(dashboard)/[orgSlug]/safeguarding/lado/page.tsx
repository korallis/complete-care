import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LADO Referrals',
};

interface LadoPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function LadoPage({ params }: LadoPageProps) {
  const { orgSlug } = await params;
  void orgSlug;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">LADO Referrals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restricted-access records for allegations against staff. Only
          Designated Safeguarding Lead and senior leadership have access.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          LADO referral list will display once authentication and RBAC are
          configured. Only users with DSL or senior leadership roles can view
          these records.
        </p>
      </div>
    </div>
  );
}
