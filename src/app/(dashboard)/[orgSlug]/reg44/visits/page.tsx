import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reg 44 Monthly Visits',
};

interface VisitsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function VisitsPage({ params }: VisitsPageProps) {
  const { orgSlug } = await params;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monthly Visits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule and record independent visitor monthly monitoring visits.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p className="text-sm">
          No visits recorded yet. Create your first monthly visit record.
        </p>
        <p className="mt-2 text-xs">
          Visit form captures: date, visitor, children spoken to, staff spoken
          to, records reviewed, and areas inspected.
        </p>
      </div>
    </div>
  );
}
