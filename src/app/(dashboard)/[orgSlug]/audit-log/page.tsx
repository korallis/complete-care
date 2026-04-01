import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { FileSearch, Shield, TrendingUp, Clock } from 'lucide-react';
import {
  getAuditLogs,
  getAuditEntityTypes,
  getAuditSummaryStats,
} from '@/features/audit/actions';
import { getOrgMembers } from '@/features/organisations/actions';
import { AuditLogTable } from '@/components/audit/audit-log-table';
import { AuditLogFilters } from '@/components/audit/audit-log-filters';
import { AuditPagination } from '@/components/audit/audit-pagination';

export const metadata: Metadata = {
  title: 'Audit Log — Complete Care',
};

interface AuditLogPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{
    page?: string;
    action?: string;
    entityType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof FileSearch;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.5_0_0)]">
          {label}
        </span>
        <div className="h-8 w-8 rounded-lg bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center">
          <Icon className="h-4 w-4 text-[oklch(0.22_0.04_160)]" aria-hidden="true" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums text-[oklch(0.15_0.03_160)]">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-[oklch(0.55_0_0)]">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AuditLogPage({
  params,
  searchParams,
}: AuditLogPageProps) {
  await params; // orgSlug not needed — session provides org context
  const sp = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  // Build filters from search params
  const filters = {
    action: sp.action || undefined,
    entityType: sp.entityType || undefined,
    userId: sp.userId || undefined,
    search: sp.search || undefined,
    dateFrom: sp.dateFrom ? new Date(sp.dateFrom) : undefined,
    dateTo: sp.dateTo ? new Date(sp.dateTo) : undefined,
  };

  const hasFilters = Object.values(filters).some(Boolean);

  // Parallel data fetching
  const [auditPage, entityTypes, stats, members] = await Promise.all([
    getAuditLogs({ page, filters }),
    getAuditEntityTypes(),
    getAuditSummaryStats(),
    getOrgMembers(),
  ]);

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_160)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-lg bg-[oklch(0.22_0.04_160)] flex items-center justify-center">
                <FileSearch className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
                Audit Log
              </h1>
            </div>
            <p className="text-sm text-[oklch(0.48_0_0)] ml-10">
              Immutable record of all data changes across your organisation. Required for CQC and Ofsted compliance.
            </p>
          </div>

          {/* Immutability notice */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[oklch(0.91_0.005_160)] bg-white px-3 py-1.5 text-xs text-[oklch(0.45_0_0)] shadow-sm">
            <Shield className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Entries are immutable
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Total entries"
            value={stats.totalEntries}
            description="All-time audit log entries"
          />
          <StatCard
            icon={Clock}
            label="Last 24 hours"
            value={stats.last24Hours}
            description="Events in the past day"
          />
          <StatCard
            icon={FileSearch}
            label="Last 7 days"
            value={stats.last7Days}
            description="Events in the past week"
          />
        </div>

        {/* Main content card */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white shadow-sm overflow-hidden">

          {/* Filters */}
          <div className="px-4 py-4 border-b border-[oklch(0.93_0.005_160)] bg-[oklch(0.98_0.003_160)]">
            <Suspense>
              <AuditLogFilters
                entityTypes={entityTypes}
                members={members.map((m) => ({ id: m.userId, name: m.name }))}
              />
            </Suspense>
          </div>

          {/* Results summary */}
          <div className="px-4 py-2.5 border-b border-[oklch(0.95_0.003_160)] flex items-center justify-between bg-white">
            <span className="text-xs text-[oklch(0.55_0_0)]">
              {hasFilters ? (
                <>
                  <span className="font-medium text-[oklch(0.25_0_0)]">{auditPage.totalCount.toLocaleString()}</span>
                  {' '}filtered {auditPage.totalCount === 1 ? 'entry' : 'entries'}
                </>
              ) : (
                <>
                  <span className="font-medium text-[oklch(0.25_0_0)]">{auditPage.totalCount.toLocaleString()}</span>
                  {' '}total {auditPage.totalCount === 1 ? 'entry' : 'entries'}
                </>
              )}
            </span>
            <span className="text-xs text-[oklch(0.65_0_0)]">
              Newest first
            </span>
          </div>

          {/* Table */}
          <AuditLogTable
            entries={auditPage.entries}
            hasFilters={hasFilters}
          />

          {/* Pagination */}
          <Suspense>
            <AuditPagination
              page={auditPage.page}
              totalPages={auditPage.totalPages}
              totalCount={auditPage.totalCount}
              pageSize={auditPage.pageSize}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
