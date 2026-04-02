import type { Metadata } from 'next';
import { BehaviourOverview } from '@/features/behaviour/components/behaviour-overview';
import { StatementOfPurpose } from '@/features/behaviour/components/statement-of-purpose';

export const metadata: Metadata = {
  title: 'Behaviour & Outcomes',
};

interface BehaviourPageProps {
  params: Promise<{
    orgSlug: string;
    personId: string;
  }>;
}

export default async function BehaviourPage({ params }: BehaviourPageProps) {
  const { personId } = await params;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Behaviour &amp; Outcomes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track development progress, record behaviour events (ABC model), and
          manage the Statement of Purpose.
        </p>
        {/* personId will be used for data fetching when DB queries are wired */}
        <span className="sr-only">Person: {personId}</span>
      </div>

      {/* Outcomes & behaviour section */}
      <section>
        <BehaviourOverview />
      </section>

      {/* Statement of Purpose section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Statement of Purpose
          </h2>
          <p className="text-sm text-slate-500">
            Version-controlled document with annual review tracking.
          </p>
        </div>
        <StatementOfPurpose />
      </section>
    </div>
  );
}
