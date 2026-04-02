import type { Metadata } from 'next';
import Link from 'next/link';
import {
  createRetentionPolicy,
  listRetentionFlags,
  listRetentionPolicies,
  reviewRetentionFlag,
  updateRetentionPolicy,
} from '@/features/gdpr/actions';
import { RetentionPolicyPanel } from '@/features/gdpr/components';
import { requireGdprPageAccess } from '@/features/gdpr/page-access';

export const metadata: Metadata = {
  title: 'GDPR Retention Review — Complete Care',
};

interface RetentionPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function GdprRetentionPage({ params }: RetentionPageProps) {
  const { orgSlug } = await params;
  const access = await requireGdprPageAccess(orgSlug, `/${orgSlug}/settings/gdpr/retention`);

  async function createPolicyAction(formData: FormData) {
    'use server';

    const result = await createRetentionPolicy({
      dataType: String(formData.get('dataType') ?? ''),
      retentionDays: Number(formData.get('retentionDays') ?? 0),
      isStatutory: formData.get('isStatutory') === 'true',
      legalBasis: String(formData.get('legalBasis') ?? 'legal_obligation') as
        | 'consent'
        | 'legal_obligation'
        | 'vital_interests'
        | 'public_task'
        | 'legitimate_interests',
      description: String(formData.get('description') ?? '') || undefined,
      autoDeleteEnabled: formData.get('autoDeleteEnabled') === 'true',
      warningDays: Number(formData.get('warningDays') ?? 30),
    });

    if (!result.success) throw new Error(result.error);
  }

  async function updatePolicyAction(formData: FormData) {
    'use server';

    const result = await updateRetentionPolicy(String(formData.get('id') ?? ''), {
      retentionDays: Number(formData.get('retentionDays') ?? 0),
      warningDays: Number(formData.get('warningDays') ?? 30),
      legalBasis: String(formData.get('legalBasis') ?? 'legal_obligation') as
        | 'consent'
        | 'legal_obligation'
        | 'vital_interests'
        | 'public_task'
        | 'legitimate_interests',
      description: String(formData.get('description') ?? '') || undefined,
      autoDeleteEnabled: formData.get('autoDeleteEnabled') === 'true',
    });

    if (!result.success) throw new Error(result.error);
  }

  async function reviewFlagAction(formData: FormData) {
    'use server';

    const result = await reviewRetentionFlag(
      String(formData.get('id') ?? ''),
      String(formData.get('decision') ?? 'approved_for_deletion') as 'approved_for_deletion' | 'retained',
      String(formData.get('reason') ?? '') || undefined,
    );

    if (!result.success) throw new Error(result.error);
  }

  const [policies, flagsResult] = await Promise.all([
    listRetentionPolicies(),
    listRetentionFlags({ pageSize: 50 }),
  ]);

  if (!access.canReadCompliance) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_150)]">
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/${orgSlug}/settings/gdpr`} className="text-sm text-[oklch(0.48_0_0)] hover:text-[oklch(0.25_0.02_160)] transition-colors">← GDPR centre</Link>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">Retention policies & deletion review</h1>
          <p className="mt-1 text-sm text-[oklch(0.5_0_0)]">Configure retention windows, preserve children-specific exceptions, and review deletion candidates safely.</p>
        </div>
        <RetentionPolicyPanel
          policies={policies}
          flags={flagsResult.flags}
          canManage={access.canManageCompliance || access.canCreateCompliance || access.canUpdateCompliance}
          createPolicyAction={access.canCreateCompliance || access.canManageCompliance ? createPolicyAction : undefined}
          updatePolicyAction={access.canUpdateCompliance || access.canManageCompliance ? updatePolicyAction : undefined}
          reviewFlagAction={access.canUpdateCompliance || access.canManageCompliance ? reviewFlagAction : undefined}
        />
      </div>
    </div>
  );
}
