import type { Metadata } from 'next';
import Link from 'next/link';
import { EvvDashboard } from './evv-dashboard';

export const metadata: Metadata = {
  title: 'Visits — EVV Dashboard',
  description: 'Electronic Visit Verification dashboard for domiciliary care visits.',
};

interface VisitsPageProps {
  params: Promise<{ orgSlug: string }>;
}

/**
 * EVV visits page — server component entry point.
 * In production this will fetch the organisation and pass organisationId
 * to the client dashboard. For now, renders the dashboard shell.
 */
export default async function VisitsPage({ params }: VisitsPageProps) {
  const { orgSlug } = await params;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-end px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href={`/${orgSlug}/travel-safety`}
          className="inline-flex items-center rounded-xl border border-[oklch(0.88_0.01_200)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.28_0.03_200)] shadow-sm transition hover:bg-[oklch(0.98_0.004_200)]"
        >
          Travel &amp; safety
        </Link>
      </div>
      <EvvDashboard orgSlug={orgSlug} />
    </div>
  );
}
