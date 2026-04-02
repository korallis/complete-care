import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Care Information',
};

/**
 * Read-only care information page for family members.
 * Displays care plans, notes, medication summary, and appointments.
 * Will be connected to auth session to load data for the linked person.
 */
export default function FamilyCareInfoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Care Information
        </h1>
        <p className="text-sm text-muted-foreground">
          Read-only access to care plans, notes, medications, and appointments.
        </p>
      </div>

      {/* Care Plans */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Care Plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No care plans available.
        </p>
      </section>

      {/* Recent Care Notes */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Recent Care Notes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No recent care notes available.
        </p>
      </section>

      {/* Medication Summary */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Medication Summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No medications recorded.
        </p>
      </section>

      {/* Upcoming Appointments */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Upcoming Appointments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No upcoming appointments.
        </p>
      </section>
    </div>
  );
}
