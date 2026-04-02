import type { Metadata } from 'next';
import Link from 'next/link';
import { createSar, listSars, updateSarStatus } from '@/features/gdpr/actions';
import { SarRequestTable } from '@/features/gdpr/components';
import { requireGdprPageAccess } from '@/features/gdpr/page-access';

export const metadata: Metadata = {
  title: 'GDPR Subject Access Requests — Complete Care',
};

interface SarsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function GdprSarsPage({ params }: SarsPageProps) {
  const { orgSlug } = await params;
  const access = await requireGdprPageAccess(orgSlug, `/${orgSlug}/settings/gdpr/sars`);

  async function createSarAction(formData: FormData) {
    'use server';

    const result = await createSar({
      subjectName: String(formData.get('subjectName') ?? ''),
      subjectEmail: String(formData.get('subjectEmail') ?? ''),
      receivedAt: String(formData.get('receivedAt') ?? ''),
      exportFormat: String(formData.get('exportFormat') ?? 'json') as 'json' | 'pdf' | 'both',
      notes: String(formData.get('notes') ?? '') || undefined,
    });

    if (!result.success) throw new Error(result.error);
  }

  async function updateSarAction(formData: FormData) {
    'use server';

    const result = await updateSarStatus(
      String(formData.get('id') ?? ''),
      String(formData.get('status') ?? 'received'),
      {
        exportPath: String(formData.get('exportPath') ?? '') || undefined,
        rejectionReason: String(formData.get('rejectionReason') ?? '') || undefined,
      },
    );

    if (!result.success) throw new Error(result.error);
  }

  const { sars } = await listSars({ pageSize: 50 });

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
          <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">Subject access requests</h1>
          <p className="mt-1 text-sm text-[oklch(0.5_0_0)]">Capture, triage, and fulfil Article 15 requests with deadline and export evidence tracking.</p>
        </div>
        <SarRequestTable
          requests={sars}
          canManage={access.canManageCompliance || access.canCreateCompliance || access.canUpdateCompliance}
          createAction={access.canCreateCompliance || access.canManageCompliance ? createSarAction : undefined}
          statusAction={access.canUpdateCompliance || access.canManageCompliance ? updateSarAction : undefined}
        />
      </div>
    </div>
  );
}
