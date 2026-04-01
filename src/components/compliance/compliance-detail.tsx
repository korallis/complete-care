'use client';

/**
 * ComplianceDetail -- Drill-down view showing all compliance items for a single staff member.
 *
 * Displays RAG status overview + tabulated data for each compliance area.
 */

import Link from 'next/link';
import type { ComplianceDetailData } from '@/features/compliance/actions';
import { RAG_STYLES } from '@/features/compliance/utils';
import type { RagColour } from '@/features/compliance/schema';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RagBadge({ colour, label }: { colour: RagColour; label?: string }) {
  const style = RAG_STYLES[colour];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label ?? style.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, RagColour> = {
    current: 'green',
    expiring_soon: 'amber',
    expired: 'red',
    not_completed: 'red',
    overdue: 'red',
    scheduled: 'green',
    completed: 'green',
    cancelled: 'grey',
    working_towards: 'amber',
  };
  const colour = map[status] ?? 'grey';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <RagBadge colour={colour} label={label} />;
}

function SectionCard({
  title,
  ragColour,
  detail,
  children,
}: {
  title: string;
  ragColour: RagColour;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[oklch(0.90_0.003_160)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-[oklch(0.97_0.003_160)] border-b border-[oklch(0.90_0.003_160)]">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-[oklch(0.22_0.04_160)]">{title}</h3>
          <RagBadge colour={ragColour} />
        </div>
        <p className="text-xs text-[oklch(0.55_0_0)]">{detail}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ComplianceDetailProps {
  data: ComplianceDetailData;
  orgSlug: string;
}

export function ComplianceDetail({ data, orgSlug }: ComplianceDetailProps) {
  const findArea = (area: string) => data.areas.find((a) => a.area === area);

  const dbsArea = findArea('dbs');
  const trainingArea = findArea('training');
  const supervisionArea = findArea('supervision');
  const qualsArea = findArea('qualifications');

  return (
    <div className="space-y-6">
      {/* Header with overall status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[oklch(0.18_0.02_160)]">
              {data.staffName}
            </h2>
            <RagBadge colour={data.overallStatus} />
          </div>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            {data.jobTitle}
          </p>
        </div>
        <Link
          href={`/${orgSlug}/staff/compliance`}
          className="text-sm text-[oklch(0.35_0.06_160)] hover:underline self-start sm:self-auto"
        >
          Back to compliance dashboard
        </Link>
      </div>

      {/* DBS Section */}
      <SectionCard
        title="DBS Checks"
        ragColour={dbsArea?.colour ?? 'grey'}
        detail={dbsArea?.detail ?? ''}
      >
        {data.dbs.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0_0)]">
            No DBS checks on record.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.90_0.003_160)]">
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Certificate
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Level
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Issued
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Recheck Due
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.dbs.map((check) => (
                <tr
                  key={check.id}
                  className="border-b border-[oklch(0.94_0.003_160)]"
                >
                  <td className="py-2 font-mono text-xs">
                    {check.certificateNumber}
                  </td>
                  <td className="py-2 capitalize">
                    {check.level.replace(/_/g, ' ')}
                  </td>
                  <td className="py-2">{check.issueDate}</td>
                  <td className="py-2">{check.recheckDate}</td>
                  <td className="py-2">
                    <StatusBadge status={check.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Training Section */}
      <SectionCard
        title="Training"
        ragColour={trainingArea?.colour ?? 'grey'}
        detail={trainingArea?.detail ?? ''}
      >
        {data.training.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0_0)]">
            No training records.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.90_0.003_160)]">
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Course
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Completed
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Expires
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.training.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-[oklch(0.94_0.003_160)]"
                >
                  <td className="py-2">{record.courseName}</td>
                  <td className="py-2">{record.completedDate}</td>
                  <td className="py-2">{record.expiryDate ?? 'N/A'}</td>
                  <td className="py-2">
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Supervision Section */}
      <SectionCard
        title="Supervisions"
        ragColour={supervisionArea?.colour ?? 'grey'}
        detail={supervisionArea?.detail ?? ''}
      >
        {data.supervisions.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0_0)]">
            No supervision records.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.90_0.003_160)]">
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Type
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Scheduled
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Completed
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.supervisions.map((sup) => (
                <tr
                  key={sup.id}
                  className="border-b border-[oklch(0.94_0.003_160)]"
                >
                  <td className="py-2 capitalize">{sup.type}</td>
                  <td className="py-2">
                    {sup.scheduledDate.toISOString().slice(0, 10)}
                  </td>
                  <td className="py-2">
                    {sup.completedDate
                      ? sup.completedDate.toISOString().slice(0, 10)
                      : 'Pending'}
                  </td>
                  <td className="py-2">
                    <StatusBadge status={sup.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Qualifications Section */}
      <SectionCard
        title="Qualifications"
        ragColour={qualsArea?.colour ?? 'grey'}
        detail={qualsArea?.detail ?? ''}
      >
        {data.qualifications.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0_0)]">
            No qualifications tracked.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.90_0.003_160)]">
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Qualification
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Level
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Status
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Completed
                </th>
                <th className="pb-2 text-left font-medium text-[oklch(0.45_0_0)]">
                  Target
                </th>
              </tr>
            </thead>
            <tbody>
              {data.qualifications.map((qual) => (
                <tr
                  key={qual.id}
                  className="border-b border-[oklch(0.94_0.003_160)]"
                >
                  <td className="py-2">{qual.name}</td>
                  <td className="py-2">{qual.level}</td>
                  <td className="py-2">
                    <StatusBadge status={qual.status} />
                  </td>
                  <td className="py-2">{qual.completedDate ?? 'N/A'}</td>
                  <td className="py-2">{qual.targetDate ?? 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
