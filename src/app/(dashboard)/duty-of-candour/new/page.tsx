import type { Metadata } from 'next';
import Link from 'next/link';
import { DocIncidentForm } from '@/features/duty-of-candour';

export const metadata: Metadata = {
  title: 'Record Duty of Candour Incident',
};

export default function NewDutyOfCandourIncidentPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[oklch(0.55_0.06_232)]">
            Regulation 20
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Record a duty of candour incident
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
            Log the initial incident, then capture follow-up steps and apology
            actions in one place.
          </p>
        </div>

        <Link
          href="/duty-of-candour"
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to incident register
        </Link>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/92 p-6 shadow-sm">
        <DocIncidentForm personId="global-duty-of-candour" />
      </div>
    </div>
  );
}
