import type { Metadata } from 'next';
import { EolCarePlanList } from '@/features/eol-care';

export const metadata: Metadata = {
  title: 'End of Life Care Plans',
};

export default function EolCarePage() {
  // TODO: Fetch plans from DB with org context
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">End of Life Care Plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage preferred place of death, DNACPR, ReSPECT, ADRT, LPA, and advance care preferences.
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex cursor-not-allowed items-center justify-center rounded-md bg-primary/60 px-4 py-2 text-sm font-medium text-primary-foreground opacity-70"
        >
          New Care Plan
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        End-of-life care plan creation is coming soon. Existing plans will
        appear here when available.
      </p>

      <EolCarePlanList plans={[]} />
    </div>
  );
}
