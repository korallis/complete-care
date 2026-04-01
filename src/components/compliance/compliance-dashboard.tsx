'use client';

/**
 * ComplianceDashboard -- Overview grid showing per-staff RAG status across all compliance areas.
 *
 * Each row shows a staff member with coloured dots for DBS, Training, Supervision,
 * and Qualifications, plus an overall compliance status.
 */

import Link from 'next/link';
import type { ComplianceOverviewData } from '@/features/compliance/actions';
import { RAG_STYLES } from '@/features/compliance/utils';
import type { RagColour } from '@/features/compliance/schema';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RagDot({ colour }: { colour: RagColour }) {
  const style = RAG_STYLES[colour];
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${style.dot}`}
      title={style.label}
      aria-label={style.label}
    />
  );
}

function RagBadge({ colour }: { colour: RagColour }) {
  const style = RAG_STYLES[colour];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: 'green' | 'amber' | 'red' | 'grey';
}) {
  const bg = {
    green: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    grey: 'bg-gray-50 border-gray-200',
  };
  const text = {
    green: 'text-emerald-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    grey: 'text-gray-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${bg[colour]}`}>
      <p className={`text-2xl font-bold ${text[colour]}`}>{value}</p>
      <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ComplianceDashboardProps {
  data: ComplianceOverviewData;
  orgSlug: string;
}

export function ComplianceDashboard({
  data,
  orgSlug,
}: ComplianceDashboardProps) {
  const { staff, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Staff"
          value={summary.totalStaff}
          colour="grey"
        />
        <SummaryCard
          label="Compliant"
          value={summary.compliant}
          colour="green"
        />
        <SummaryCard
          label="Attention Needed"
          value={summary.attention}
          colour="amber"
        />
        <SummaryCard
          label="Non-Compliant"
          value={summary.nonCompliant}
          colour="red"
        />
      </div>

      {/* Staff compliance grid */}
      {staff.length === 0 ? (
        <div className="text-center py-12 text-[oklch(0.55_0_0)]">
          <p className="text-lg font-medium">No staff members found</p>
          <p className="text-sm mt-1">
            Add staff members to begin tracking compliance.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[oklch(0.90_0.003_160)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.90_0.003_160)] bg-[oklch(0.97_0.003_160)]">
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
                  Staff Member
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
                  Role
                </th>
                <th className="px-3 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
                  DBS
                </th>
                <th className="px-3 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
                  Training
                </th>
                <th className="px-3 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
                  Supervision
                </th>
                <th className="px-3 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
                  Quals
                </th>
                <th className="px-4 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
                  Overall
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((row) => (
                <tr
                  key={row.staffId}
                  className="border-b border-[oklch(0.94_0.003_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/${orgSlug}/staff/compliance/${row.staffId}`}
                      className="font-medium text-[oklch(0.22_0.04_160)] hover:underline"
                    >
                      {row.staffName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[oklch(0.55_0_0)]">
                    {row.jobTitle}
                  </td>
                  {row.areas.map((area) => (
                    <td key={area.area} className="px-3 py-3 text-center">
                      <span title={area.detail}>
                        <RagDot colour={area.colour} />
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <RagBadge colour={row.overallStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
