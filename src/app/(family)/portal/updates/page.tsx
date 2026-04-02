import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Updates',
};

/**
 * Family portal updates page.
 * Displays photos and updates shared by staff for the linked person.
 */
export default function FamilyUpdatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Updates</h1>
        <p className="text-sm text-muted-foreground">
          Photos and updates shared by the care team.
        </p>
      </div>

      {/* Updates list — rendered by UpdateCard components when data is available */}
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        <p>No updates shared yet. Check back soon for photos and news.</p>
      </div>
    </div>
  );
}
