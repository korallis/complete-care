import type { Metadata } from 'next';
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
      <EvvDashboard orgSlug={orgSlug} />
    </div>
  );
}
