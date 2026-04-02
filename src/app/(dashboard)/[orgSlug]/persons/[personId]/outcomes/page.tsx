import type { Metadata } from 'next';
import { OutcomesDashboard } from './outcomes-dashboard';

export const metadata: Metadata = {
  title: 'Outcomes & Skills',
};

/**
 * Outcomes page — SMART goals, traffic-light reviews, skills development,
 * community access, and support hours for a person.
 *
 * Data fetching will be wired to real queries once auth context is available.
 * For now, the page renders the dashboard shell with demo-friendly empty states.
 */
export default async function OutcomesPage({
  params,
}: {
  params: Promise<{ orgSlug: string; personId: string }>;
}) {
  const { orgSlug, personId } = await params;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div>
        <nav className="mb-2 text-xs text-muted-foreground">
          <span>{orgSlug}</span>
          <span className="mx-1.5">/</span>
          <span>Persons</span>
          <span className="mx-1.5">/</span>
          <span className="text-foreground font-medium">Outcomes & Skills</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Outcomes & Skills Development
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SMART goals, progress reviews, skills tracking, and community access
          for this individual.
        </p>
      </div>

      <OutcomesDashboard orgSlug={orgSlug} personId={personId} />
    </div>
  );
}
