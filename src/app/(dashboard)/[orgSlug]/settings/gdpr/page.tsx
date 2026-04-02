import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getOverdueSars,
  listDataExports,
  listErasureRequests,
  listRetentionFlags,
  listSars,
} from '@/features/gdpr/actions';
import { GdprDashboard } from '@/features/gdpr/components';
import { requireGdprPageAccess } from '@/features/gdpr/page-access';

export const metadata: Metadata = {
  title: 'GDPR Centre — Complete Care',
  description: 'Manage subject access requests, retention review, exports, and erasure workflows.',
};

interface GdprSettingsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function GdprSettingsPage({ params }: GdprSettingsPageProps) {
  const { orgSlug } = await params;
  const access = await requireGdprPageAccess(orgSlug);

  if (!access.canReadCompliance) {
    return null;
  }

  const [sarSummary, overdueSars, erasureSummary, retentionSummary, exportSummary] = await Promise.all([
    listSars({ pageSize: 50 }),
    getOverdueSars(),
    listErasureRequests({ pageSize: 50 }),
    listRetentionFlags({ pageSize: 50 }),
    listDataExports({ pageSize: 50 }),
  ]);

  const expiringFlags = retentionSummary.flags.filter((flag) => flag.status === 'warning').length;

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_150)]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <Link
            href={`/${orgSlug}/settings`}
            className="text-sm text-[oklch(0.48_0_0)] hover:text-[oklch(0.25_0.02_160)] transition-colors"
          >
            ← Settings
          </Link>
        </div>

        <GdprDashboard
          orgSlug={orgSlug}
          stats={{
            totalSars: sarSummary.totalCount,
            overdueSars: overdueSars.length,
            erasureRequests: erasureSummary.totalCount,
            retentionFlags: retentionSummary.totalCount,
            expiringFlags,
            exportJobs: exportSummary.totalCount,
          }}
        />
      </div>
    </div>
  );
}
