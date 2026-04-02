import type { Metadata } from 'next';
import Link from 'next/link';
import { REPORT_SECTION_LABELS } from '@/features/reg44';

export const metadata: Metadata = {
  title: 'Reg 44 Reports',
};

interface ReportsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { orgSlug } = await params;

  const sectionKeys = Object.keys(REPORT_SECTION_LABELS);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reg 44 Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Structured monthly monitoring reports following the regulatory
            template.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Report Template Sections</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {sectionKeys.map((key) => (
            <div
              key={key}
              className="rounded-md border px-3 py-2 text-sm"
            >
              {REPORT_SECTION_LABELS[key]}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p className="text-sm">
          No reports created yet. Reports are linked to monthly visits.
        </p>
      </div>
    </div>
  );
}
