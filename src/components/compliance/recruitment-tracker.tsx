'use client';

/**
 * RecruitmentTracker -- Displays recruitment records with interview, reference, and offer status.
 */

import Link from 'next/link';
import type { RecruitmentRecordListItem } from '@/features/compliance/actions';

function OfferStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    pending: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
    accepted: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    declined: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      dot: 'bg-red-500',
    },
  };
  const style = styles[status] ?? styles.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface RecruitmentTrackerProps {
  records: RecruitmentRecordListItem[];
  orgSlug: string;
  canManage: boolean;
}

export function RecruitmentTracker({
  records,
  orgSlug,
}: RecruitmentTrackerProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-[oklch(0.55_0_0)]">
        <p className="text-lg font-medium">No recruitment records</p>
        <p className="text-sm mt-1">
          Recruitment records will appear here once staff are in the hiring pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[oklch(0.90_0.003_160)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[oklch(0.90_0.003_160)] bg-[oklch(0.97_0.003_160)]">
            <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
              Candidate
            </th>
            <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
              Interview
            </th>
            <th className="px-4 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
              References
            </th>
            <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
              Offer Date
            </th>
            <th className="px-4 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
              Offer Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
              Start Date
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-b border-[oklch(0.94_0.003_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/${orgSlug}/staff/${record.staffProfileId}`}
                  className="font-medium text-[oklch(0.22_0.04_160)] hover:underline"
                >
                  {record.staffName}
                </Link>
              </td>
              <td className="px-4 py-3 text-[oklch(0.55_0_0)]">
                {record.interviewDate ?? 'Not set'}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-[oklch(0.93_0.003_160)] text-xs font-medium text-[oklch(0.45_0_0)]">
                  {record.referenceCount}
                </span>
              </td>
              <td className="px-4 py-3 text-[oklch(0.55_0_0)]">
                {record.offerDate ?? 'Not set'}
              </td>
              <td className="px-4 py-3 text-center">
                <OfferStatusBadge status={record.offerStatus} />
              </td>
              <td className="px-4 py-3 text-[oklch(0.55_0_0)]">
                {record.startDate ?? 'Not set'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
