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
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex cursor-not-allowed items-center justify-center rounded-md bg-primary/60 px-4 py-2 text-sm font-medium text-primary-foreground opacity-70"
        >
          New Report
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Reg 45 report authoring is coming soon. The current page remains a
        read-only landing state until that workflow is ready.
      </p>

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
