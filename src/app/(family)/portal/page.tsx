import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Home',
};

/**
 * Family portal home page.
 * Shows a list of linked persons and quick access to domain-specific views.
 * Session/auth data will be integrated when Auth.js v5 family role is implemented.
 */
export default function FamilyPortalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Family Portal</h1>
        <p className="text-sm text-muted-foreground">
          View care information, messages, and updates for your family members.
        </p>
      </div>

      {/* Linked persons list — populated from familyMembers table */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Your Family Members</h2>
        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          <p>
            Your linked family members will appear here once your account is
            approved by the care team.
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Messages</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Send and receive messages with the care team.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Updates</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            View photos and updates shared by staff.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Care Information</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only access to care plans, notes, and medications.
          </p>
        </div>
      </section>
    </div>
  );
}
