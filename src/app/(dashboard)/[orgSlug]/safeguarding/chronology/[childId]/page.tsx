import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safeguarding Chronology',
};

interface ChronologyPageProps {
  params: Promise<{ orgSlug: string; childId: string }>;
}

export default async function ChronologyPage({
  params,
}: ChronologyPageProps) {
  const { orgSlug, childId } = await params;
  void orgSlug;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/*
        In production, this would:
        1. Fetch the child's details
        2. Call getChildChronology(childId) to get all entries
        3. Render the ChronologyTimeline component
        4. Provide PDF export functionality
      */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Safeguarding chronology for child <code>{childId}</code> will display
          once authentication is configured. The timeline auto-populates from
          all safeguarding records and supports manual historical entries.
        </p>
      </div>
    </div>
  );
}
