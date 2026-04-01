import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import {
  getComplianceOverview,
  getComplianceAlerts,
  listRecruitmentRecords,
} from '@/features/compliance/actions';
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard';
import { ComplianceAlertList } from '@/components/compliance/compliance-alert-list';
import { RecruitmentTracker } from '@/components/compliance/recruitment-tracker';
import { ComplianceExportButton } from '@/components/compliance/compliance-export-button';

export const metadata: Metadata = {
  title: 'Compliance Dashboard - Complete Care',
};

interface CompliancePageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CompliancePage({ params }: CompliancePageProps) {
  const { orgSlug } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) {
      notFound();
    }
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/compliance`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'compliance');
  const canManage = hasPermission(role, 'manage', 'compliance');
  const canExport = hasPermission(role, 'export', 'compliance');

  if (!canRead) {
    notFound();
  }

  const [overview, alerts, recruitmentRecords] = await Promise.all([
    getComplianceOverview(),
    getComplianceAlerts(),
    listRecruitmentRecords(),
  ]);

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
            Staff Compliance
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            RAG status overview across DBS, training, supervision, and
            qualifications
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href={`/${orgSlug}/staff/agencies`}
            className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-4 py-2.5 text-sm font-medium text-[oklch(0.35_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Agency Register
          </Link>
          {canExport && <ComplianceExportButton />}
        </div>
      </div>

      {/* Alerts section */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-[oklch(0.22_0.04_160)] mb-3">
            Compliance Alerts
            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-100 text-xs font-medium text-red-700 px-1.5">
              {alerts.length}
            </span>
          </h2>
          <ComplianceAlertList alerts={alerts} orgSlug={orgSlug} />
        </section>
      )}

      {/* Main compliance grid */}
      <section>
        <h2 className="text-lg font-medium text-[oklch(0.22_0.04_160)] mb-3">
          Staff Compliance Overview
        </h2>
        <Suspense
          fallback={
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-[oklch(0.93_0.003_160)] animate-pulse"
                />
              ))}
            </div>
          }
        >
          <ComplianceDashboard data={overview} orgSlug={orgSlug} />
        </Suspense>
      </section>

      {/* Recruitment tracking */}
      <section>
        <h2 className="text-lg font-medium text-[oklch(0.22_0.04_160)] mb-3">
          Recruitment Tracker
        </h2>
        <RecruitmentTracker
          records={recruitmentRecords}
          orgSlug={orgSlug}
          canManage={canManage}
        />
      </section>
    </div>
  );
}
