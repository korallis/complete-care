import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Section 47 Investigations',
};

interface Section47PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function Section47Page({ params }: Section47PageProps) {
  const { orgSlug } = await params;
  void orgSlug;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">
          Section 47 Investigations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Children Act 1989 Section 47 enquiry cooperation tracking. Record
          strategy meetings, attendees, decisions, and outcomes.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Section 47 investigation list will display once authentication is
          configured.
        </p>
      </div>
    </div>
  );
}
