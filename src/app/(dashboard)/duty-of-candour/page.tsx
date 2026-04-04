import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Duty of Candour',
};

export default function DutyOfCandourPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Duty of Candour</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CQC Regulation 20 — Record and track notifiable safety incidents through the required workflow.
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex cursor-not-allowed items-center justify-center rounded-md bg-primary/60 px-4 py-2 text-sm font-medium text-primary-foreground opacity-70"
        >
          Record Incident
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Incident creation from this dashboard is coming soon. Existing records
        can still be reviewed below.
      </p>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Open Incidents</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Awaiting Written Follow-up</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Under Investigation</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-800">0</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No incidents recorded.</p>
      </div>
    </div>
  );
}
