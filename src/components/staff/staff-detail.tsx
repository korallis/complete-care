'use client';

/**
 * StaffDetail — client component for the staff detail page.
 * Handles tab navigation and status management actions.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaffStatusBadge, StaffContractBadge } from './staff-status-badge';
import { CONTRACT_TYPE_LABELS, STATUS_LABELS } from '@/features/staff/schema';
import type { StaffStatus, StaffContractType } from '@/features/staff/schema';
import { getValidNextStatuses } from '@/features/staff/schema';
import type { StaffProfile } from '@/lib/db/schema/staff-profiles';
import type { EmploymentHistoryEntry } from '@/lib/db/schema/staff-profiles';

type Tab = 'overview' | 'dbs' | 'training' | 'supervision';

type StaffDetailProps = {
  staff: StaffProfile;
  orgSlug: string;
  canEdit: boolean;
  canUpdateStatus: boolean;
  onUpdateStatus?: (
    status: string,
    reason?: string,
  ) => Promise<{ success: boolean; error?: string }>;
};

const TABS: { id: Tab; label: string; comingSoon?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'dbs', label: 'DBS Checks', comingSoon: true },
  { id: 'training', label: 'Training', comingSoon: true },
  { id: 'supervision', label: 'Supervision', comingSoon: true },
];

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">{label}</dt>
      <dd
        className={`text-sm text-[oklch(0.22_0.04_160)] ${mono ? 'font-mono' : ''} ${!value ? 'text-[oklch(0.7_0_0)] italic' : ''}`}
      >
        {value ?? '--'}
      </dd>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function formatDate(date: string | null | undefined): string | null {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

function OverviewTab({ staff }: { staff: StaffProfile }) {
  const employmentHistory = (staff.employmentHistory ?? []) as EmploymentHistoryEntry[];

  return (
    <div className="space-y-6">
      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employment info */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Employment details
          </h3>
          <dl className="space-y-3">
            <InfoRow label="Job title" value={staff.jobTitle} />
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
                Contract type
              </dt>
              <dd>
                <StaffContractBadge contractType={staff.contractType} />
              </dd>
            </div>
            <InfoRow
              label="Weekly hours"
              value={staff.weeklyHours ? `${staff.weeklyHours} hrs/week` : null}
            />
            <InfoRow label="Start date" value={formatDate(staff.startDate)} />
            <InfoRow label="End date" value={formatDate(staff.endDate)} />
            <InfoRow label="NI number" value={staff.niNumber} mono />
          </dl>
        </div>

        {/* Contact info */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Contact details
          </h3>
          <dl className="space-y-3">
            <InfoRow label="Email" value={staff.email} />
            <InfoRow label="Phone" value={staff.phone} />
          </dl>
        </div>

        {/* Emergency contact */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Emergency contact
          </h3>
          {staff.emergencyContactName ? (
            <dl className="space-y-3">
              <InfoRow label="Name" value={staff.emergencyContactName} />
              <InfoRow label="Phone" value={staff.emergencyContactPhone} />
              <InfoRow
                label="Relationship"
                value={staff.emergencyContactRelation}
              />
            </dl>
          ) : (
            <p className="text-sm text-[oklch(0.65_0_0)] italic">
              No emergency contact recorded
            </p>
          )}
        </div>

        {/* Employment history */}
        {employmentHistory.length > 0 && (
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
              Employment history
            </h3>
            <ul className="space-y-3">
              {employmentHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-[oklch(0.93_0.003_160)] bg-[oklch(0.985_0.003_160)] p-3"
                >
                  <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                    {entry.jobTitle}
                  </p>
                  <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
                    {formatDate(entry.startDate)} -- {formatDate(entry.endDate) ?? 'Present'}
                    {' | '}
                    {CONTRACT_TYPE_LABELS[entry.contractType as StaffContractType] ?? entry.contractType}
                    {entry.weeklyHours ? ` | ${entry.weeklyHours} hrs/week` : ''}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-[oklch(0.55_0_0)] mt-1 italic">
                      {entry.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-[oklch(0.45_0.07_160)]"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] mb-1">
        {label}
      </p>
      <p className="text-sm text-[oklch(0.55_0_0)]">
        This feature is coming soon. It will be available in a future update.
      </p>
    </div>
  );
}

export function StaffDetail({
  staff,
  orgSlug,
  canEdit,
  canUpdateStatus,
  onUpdateStatus,
}: StaffDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isPending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);
  const router = useRouter();

  const validNextStatuses = getValidNextStatuses(staff.status);

  const handleStatusChange = (newStatus: string) => {
    if (!onUpdateStatus) return;
    setStatusError(null);

    const reason =
      newStatus === 'terminated' || newStatus === 'suspended'
        ? window.prompt(
            `Please provide a reason for changing status to ${STATUS_LABELS[newStatus as StaffStatus]}:`,
          )
        : undefined;

    // User cancelled the prompt
    if (
      (newStatus === 'terminated' || newStatus === 'suspended') &&
      reason === null
    ) {
      return;
    }

    startTransition(async () => {
      const result = await onUpdateStatus(newStatus, reason ?? undefined);
      if (!result.success) {
        setStatusError(result.error ?? 'Failed to update status');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Staff header */}
      <div className="rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 h-16 w-16 rounded-full bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center">
              <span className="text-xl font-semibold text-[oklch(0.35_0.04_160)]">
                {getInitials(staff.fullName)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)] truncate">
                    {staff.fullName}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StaffStatusBadge status={staff.status} />
                    <StaffContractBadge contractType={staff.contractType} />
                    <span className="text-sm text-[oklch(0.6_0_0)]">
                      {staff.jobTitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {canEdit && (
                    <Link
                      href={`/${orgSlug}/staff/${staff.id}/edit`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </Link>
                  )}

                  {canUpdateStatus &&
                    validNextStatuses.length > 0 &&
                    validNextStatuses.map((ns) => (
                      <button
                        key={ns}
                        type="button"
                        onClick={() => handleStatusChange(ns)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] ${
                          ns === 'terminated'
                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                            : ns === 'suspended'
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-[oklch(0.88_0.005_160)] text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)]'
                        }`}
                      >
                        {STATUS_LABELS[ns]}
                      </button>
                    ))}
                </div>
              </div>

              {statusError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {statusError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="border-t border-[oklch(0.91_0.005_160)] px-6 overflow-x-auto"
          role="tablist"
          aria-label="Staff profile sections"
        >
          <div className="flex gap-0 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[oklch(0.35_0.06_160)] ${
                  activeTab === tab.id
                    ? 'border-[oklch(0.35_0.06_160)] text-[oklch(0.25_0.08_160)]'
                    : 'border-transparent text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:border-[oklch(0.85_0.01_160)]'
                }`}
              >
                {tab.label}
                {tab.comingSoon && (
                  <span className="ml-1.5 rounded bg-[oklch(0.94_0.01_160)] px-1.5 py-0.5 text-[10px] font-medium text-[oklch(0.5_0.02_160)]">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'overview' && <OverviewTab staff={staff} />}
        {activeTab === 'dbs' && <ComingSoonTab label="DBS Checks" />}
        {activeTab === 'training' && <ComingSoonTab label="Training Records" />}
        {activeTab === 'supervision' && (
          <ComingSoonTab label="Supervision Sessions" />
        )}
      </div>
    </div>
  );
}
