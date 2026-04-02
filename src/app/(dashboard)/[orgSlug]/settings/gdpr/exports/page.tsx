import type { Metadata } from 'next';
import Link from 'next/link';
import { createDataExport, listDataExports } from '@/features/gdpr/actions';
import { ExportJobsTable } from '@/features/gdpr/components';
import { requireGdprPageAccess } from '@/features/gdpr/page-access';

export const metadata: Metadata = {
  title: 'GDPR Export Jobs — Complete Care',
};

interface ExportsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function GdprExportsPage({ params }: ExportsPageProps) {
  const { orgSlug } = await params;
  const access = await requireGdprPageAccess(orgSlug, `/${orgSlug}/settings/gdpr/exports`);

  async function createExportAction(formData: FormData) {
    'use server';

    const result = await createDataExport({
      exportType: String(formData.get('exportType') ?? 'person_data'),
      format: String(formData.get('format') ?? 'json'),
      personId: String(formData.get('personId') ?? '') || undefined,
      sarId: String(formData.get('sarId') ?? '') || undefined,
    });

    if (!result.success) throw new Error(result.error);
  }

  const { exports } = await listDataExports({ pageSize: 50 });

  if (!access.canReadCompliance) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_150)]">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/${orgSlug}/settings/gdpr`} className="text-sm text-[oklch(0.48_0_0)] hover:text-[oklch(0.25_0.02_160)] transition-colors">← GDPR centre</Link>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">Export jobs</h1>
          <p className="mt-1 text-sm text-[oklch(0.5_0_0)]">Queue and review data portability exports with a visible evidence ledger for SAR and portability workflows.</p>
        </div>
        <ExportJobsTable
          exports={exports}
          canManage={access.canManageCompliance || access.canExportCompliance}
          createAction={access.canExportCompliance || access.canManageCompliance ? createExportAction : undefined}
        />
      </div>
    </div>
  );
}
