'use client';

/**
 * DoLS Dashboard — Register view, expiry tracking, and status management.
 *
 * Displays all DoLS applications for an organisation with:
 * - Status badges with colour-coded lifecycle states
 * - Expiry warnings with configurable lead times
 * - Prominent expired flag styling
 * - Filterable register table
 */

import { useState, useMemo } from 'react';
import { isDolsExpiringSoon, isDolsExpired, type DolsStatus } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DolsRecord {
  id: string;
  personId: string;
  personName: string;
  managingAuthority: string;
  supervisoryBody: string;
  laReferenceNumber: string | null;
  applicationDate: string;
  reason: string;
  status: DolsStatus;
  authorisationStartDate: string | null;
  authorisationEndDate: string | null;
  reviewDate: string | null;
  conditions: string | null;
  expiryAlertDays: number;
  personsRepresentative: string | null;
  imcaInstructed: boolean;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const statusConfig: Record<DolsStatus, { label: string; className: string }> = {
  applied: {
    label: 'Applied',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  granted: {
    label: 'Granted',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  refused: {
    label: 'Refused',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  expired: {
    label: 'Expired',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  renewed: {
    label: 'Renewed',
    className: 'bg-teal-100 text-teal-800 border-teal-200',
  },
};

function StatusBadge({ status }: { status: DolsStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`
        inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}

function ExpiryBadge({
  endDate,
  alertDays,
  status,
}: {
  endDate: string | null;
  alertDays: number;
  status: DolsStatus;
}) {
  if (status !== 'granted' || !endDate) return null;

  const now = new Date();
  const expired = isDolsExpired(endDate, now);
  const expiringSoon = isDolsExpiringSoon(endDate, alertDays, now);

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border-2 border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 animate-pulse">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        EXPIRED
      </span>
    );
  }

  if (expiringSoon) {
    const daysLeft = Math.ceil(
      (new Date(endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Expires in {daysLeft}d
      </span>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Person profile badges (for embedding in person detail pages)
// ---------------------------------------------------------------------------

export function DolsProfileBadge({
  dolsRecords,
}: {
  dolsRecords: DolsRecord[];
}) {
  const activeDols = dolsRecords.filter((d) => d.status === 'granted');
  const expiredDols = activeDols.filter((d) => isDolsExpired(d.authorisationEndDate));
  const expiringSoon = activeDols.filter(
    (d) =>
      !isDolsExpired(d.authorisationEndDate) &&
      isDolsExpiringSoon(d.authorisationEndDate, d.expiryAlertDays),
  );

  if (activeDols.length === 0 && expiredDols.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {expiredDols.length > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md border-2 border-red-300 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          DoLS Expired ({expiredDols.length})
        </span>
      )}
      {expiringSoon.length > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          DoLS Expiring Soon
        </span>
      )}
      {activeDols.length > 0 && expiredDols.length === 0 && expiringSoon.length === 0 && (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          DoLS Active
        </span>
      )}
    </div>
  );
}

export function LpaAdrtBadges({
  records,
}: {
  records: Array<{ recordType: string; isActive: boolean }>;
}) {
  const active = records.filter((r) => r.isActive);
  const hasLpaHealth = active.some((r) => r.recordType === 'lpa_health');
  const hasLpaFinance = active.some((r) => r.recordType === 'lpa_finance');
  const hasAdrt = active.some((r) => r.recordType === 'adrt');

  if (!hasLpaHealth && !hasLpaFinance && !hasAdrt) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {hasLpaHealth && (
        <span className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
          LPA (Health)
        </span>
      )}
      {hasLpaFinance && (
        <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
          LPA (Finance)
        </span>
      )}
      {hasAdrt && (
        <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
          ADRT
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DoLS Register table
// ---------------------------------------------------------------------------

type FilterStatus = DolsStatus | 'all' | 'expiring';

export interface DolsDashboardProps {
  records: DolsRecord[];
  onViewApplication: (id: string) => void;
  onNewApplication: () => void;
}

export function DolsDashboard({
  records,
  onViewApplication,
  onNewApplication,
}: DolsDashboardProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo(() => {
    let result = records;

    if (filter !== 'all') {
      if (filter === 'expiring') {
        result = result.filter(
          (r) =>
            r.status === 'granted' &&
            (isDolsExpiringSoon(r.authorisationEndDate, r.expiryAlertDays) ||
              isDolsExpired(r.authorisationEndDate)),
        );
      } else {
        result = result.filter((r) => r.status === filter);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.personName.toLowerCase().includes(q) ||
          r.managingAuthority.toLowerCase().includes(q) ||
          r.supervisoryBody.toLowerCase().includes(q) ||
          (r.laReferenceNumber?.toLowerCase().includes(q) ?? false),
      );
    }

    return result;
  }, [records, filter, search]);

  // Summary counts
  const counts = useMemo(() => {
    const now = new Date();
    return {
      total: records.length,
      applied: records.filter((r) => r.status === 'applied').length,
      granted: records.filter((r) => r.status === 'granted').length,
      expiring: records.filter(
        (r) =>
          r.status === 'granted' &&
          (isDolsExpiringSoon(r.authorisationEndDate, r.expiryAlertDays, now) ||
            isDolsExpired(r.authorisationEndDate, now)),
      ).length,
      refused: records.filter((r) => r.status === 'refused').length,
    };
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">DoLS Register</h1>
          <p className="mt-1 text-sm text-slate-500">
            Deprivation of Liberty Safeguards — application tracking and expiry management
          </p>
        </div>
        <button
          onClick={onNewApplication}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white
                     hover:bg-slate-800 transition-colors"
        >
          New Application
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Active"
          count={counts.granted}
          className="border-emerald-200 bg-emerald-50"
          countClassName="text-emerald-700"
        />
        <SummaryCard
          label="Pending"
          count={counts.applied}
          className="border-blue-200 bg-blue-50"
          countClassName="text-blue-700"
        />
        <SummaryCard
          label="Expiring / Expired"
          count={counts.expiring}
          className={counts.expiring > 0 ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}
          countClassName={counts.expiring > 0 ? 'text-red-700' : 'text-slate-600'}
        />
        <SummaryCard
          label="Total"
          count={counts.total}
          className="border-slate-200 bg-slate-50"
          countClassName="text-slate-700"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'applied', label: 'Applied' },
              { value: 'granted', label: 'Granted' },
              { value: 'expiring', label: 'Expiring' },
              { value: 'refused', label: 'Refused' },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`
                rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                ${filter === value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'}
              `}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by name, authority, or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm
                     placeholder:text-slate-400 focus:border-slate-500 focus:outline-none
                     focus:ring-2 focus:ring-slate-200 w-72"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-600">Person</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Supervisory Body</th>
              <th className="px-4 py-3 font-semibold text-slate-600">LA Ref</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Applied</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Expiry</th>
              <th className="px-4 py-3 font-semibold text-slate-600">IMCA</th>
              <th className="px-4 py-3 font-semibold text-slate-600" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                  No DoLS applications found
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className={`
                    hover:bg-slate-50 transition-colors cursor-pointer
                    ${isDolsExpired(record.authorisationEndDate) && record.status === 'granted'
                      ? 'bg-red-50/40'
                      : ''}
                  `}
                  onClick={() => onViewApplication(record.id)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {record.personName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {record.supervisoryBody}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {record.laReferenceNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(record.applicationDate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {record.authorisationEndDate && (
                        <span className="text-xs text-slate-500">
                          {formatDate(record.authorisationEndDate)}
                        </span>
                      )}
                      <ExpiryBadge
                        endDate={record.authorisationEndDate}
                        alertDays={record.expiryAlertDays}
                        status={record.status}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {record.imcaInstructed ? (
                      <span className="text-xs font-medium text-emerald-600">Yes</span>
                    ) : (
                      <span className="text-xs text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewApplication(record.id);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  count,
  className,
  countClassName,
}: {
  label: string;
  count: number;
  className: string;
  countClassName: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${countClassName}`}>{count}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
