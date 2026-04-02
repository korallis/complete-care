import type { Metadata } from 'next';
import Link from 'next/link';
import { createErasureRequest, listErasureRequests, updateErasureRequestStatus } from '@/features/gdpr/actions';
import { ErasureRequestTable } from '@/features/gdpr/components';
import { requireGdprPageAccess } from '@/features/gdpr/page-access';

export const metadata: Metadata = {
  title: 'GDPR Erasure Requests — Complete Care',
};

interface ErasurePageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function GdprErasurePage({ params }: ErasurePageProps) {
  const { orgSlug } = await params;
  const access = await requireGdprPageAccess(orgSlug, `/${orgSlug}/settings/gdpr/erasure`);

  async function createErasureAction(formData: FormData) {
    'use server';

    const result = await createErasureRequest({
      subjectName: String(formData.get('subjectName') ?? ''),
      subjectEmail: String(formData.get('subjectEmail') ?? ''),
      receivedAt: String(formData.get('receivedAt') ?? ''),
      notes: String(formData.get('notes') ?? '') || undefined,
    });

    if (!result.success) throw new Error(result.error);
  }

  async function updateErasureAction(formData: FormData) {
    'use server';

    const anonymisedFieldsValue = String(formData.get('anonymisedFields') ?? '').trim();
    const result = await updateErasureRequestStatus(
      String(formData.get('id') ?? ''),
      String(formData.get('status') ?? 'received'),
      {
        rejectionReason: String(formData.get('rejectionReason') ?? '') || undefined,
        anonymisedFields: anonymisedFieldsValue ? JSON.parse(anonymisedFieldsValue) : undefined,
      },
    );

    if (!result.success) throw new Error(result.error);
  }

  const { requests } = await listErasureRequests({ pageSize: 50 });

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
          <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">Erasure requests</h1>
          <p className="mt-1 text-sm text-[oklch(0.5_0_0)]">Manage Article 17 deletion or anonymisation workflows while recording exemptions and redaction evidence.</p>
        </div>
        <ErasureRequestTable
          requests={requests}
          canManage={access.canManageCompliance || access.canCreateCompliance || access.canUpdateCompliance}
          createAction={access.canCreateCompliance || access.canManageCompliance ? createErasureAction : undefined}
          statusAction={access.canUpdateCompliance || access.canManageCompliance ? updateErasureAction : undefined}
        />
      </div>
    </div>
  );
}
