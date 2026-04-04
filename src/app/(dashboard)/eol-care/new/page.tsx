import type { Metadata } from 'next';
import Link from 'next/link';
import { EolCarePlanForm } from '@/features/eol-care';

export const metadata: Metadata = {
  title: 'New End of Life Care Plan',
};

export default function NewEolCarePlanPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[oklch(0.55_0.06_232)]">
            Palliative and advance planning
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Create an end of life care plan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
            Record ReSPECT, DNACPR, treatment escalation, and cultural needs
            without leaving the global care-planning workspace.
          </p>
        </div>

        <Link
          href="/eol-care"
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to care plans
        </Link>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/92 p-6 shadow-sm">
        <EolCarePlanForm personId="global-eol-plan" />
      </div>
    </div>
  );
}
