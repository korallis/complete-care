import type { Metadata } from 'next';
import { VisitDetail } from './visit-detail';

export const metadata: Metadata = {
  title: 'Visit Detail — EVV',
  description: 'Electronic Visit Verification detail view.',
};

interface VisitDetailPageProps {
  params: Promise<{ orgSlug: string; visitId: string }>;
}

/**
 * Visit detail page — server component entry point.
 * Fetches the visit and its check events, then renders the detail view.
 */
export default async function VisitDetailPage({ params }: VisitDetailPageProps) {
  const { orgSlug, visitId } = await params;

  return (
    <div className="min-h-screen bg-background">
      <VisitDetail orgSlug={orgSlug} visitId={visitId} />
    </div>
  );
}
