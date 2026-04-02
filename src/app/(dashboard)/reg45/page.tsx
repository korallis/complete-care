import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reg 45 Quality Reviews',
};

export default function Reg45Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reg 45 Six-Monthly Quality Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quality reviews by the Responsible Individual covering Reg 44 findings, care quality, and recommendations.
          </p>
        </div>
        <a
          href="/reg45/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Report
        </a>
      </div>

      {/* Report list placeholder */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No Reg 45 reports yet.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a six-monthly quality review report.
        </p>
      </div>
    </div>
  );
}
