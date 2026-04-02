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
        <a
          href="/eol-care/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Care Plan
        </a>
      </div>

      <EolCarePlanList plans={[]} />
    </div>
  );
}
