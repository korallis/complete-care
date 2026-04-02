'use client';

/**
 * LacRecordDetail — displays the full LAC record for a child including
 * legal status, social worker details, and IRO contact information.
 */

import Link from 'next/link';
import type { LacRecord } from '@/lib/db/schema/lac';
import {
  LAC_LEGAL_STATUS_LABELS,
  LAC_LEGAL_STATUS_SHORT_LABELS,
  type LacLegalStatus,
} from '@/features/lac/constants';

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not recorded';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Contact card
// ---------------------------------------------------------------------------

type ContactCardProps = {
  title: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

function ContactCard({ title, name, email, phone }: ContactCardProps) {
  const hasInfo = name || email || phone;

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
        {title}
      </h3>
      {hasInfo ? (
        <dl className="space-y-2">
          {name && (
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
                Name
              </dt>
              <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
                {name}
              </dd>
            </div>
          )}
          {email && (
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
                Email
              </dt>
              <dd className="mt-0.5 text-sm">
                <a
                  href={`mailto:${email}`}
                  className="text-[oklch(0.35_0.06_160)] underline hover:no-underline"
                >
                  {email}
                </a>
              </dd>
            </div>
          )}
          {phone && (
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
                Phone
              </dt>
              <dd className="mt-0.5 text-sm">
                <a
                  href={`tel:${phone}`}
                  className="text-[oklch(0.35_0.06_160)] underline hover:no-underline"
                >
                  {phone}
                </a>
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-sm text-[oklch(0.65_0_0)] italic">
          No contact details recorded.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type LacRecordDetailProps = {
  record: LacRecord;
  personName: string;
  orgSlug: string;
  personId: string;
  canEdit: boolean;
};

export function LacRecordDetail({
  record,
  personName,
  orgSlug,
  personId,
  canEdit,
}: LacRecordDetailProps) {
  const legalStatus = record.legalStatus as LacLegalStatus;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)]">
                LAC Record
              </h1>
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {LAC_LEGAL_STATUS_SHORT_LABELS[legalStatus] ?? legalStatus}
              </span>
            </div>
            <p className="text-sm text-[oklch(0.55_0_0)]">
              LAC documentation for{' '}
              <span className="font-medium text-[oklch(0.35_0.04_160)]">
                {personName}
              </span>
            </p>
          </div>

          {canEdit && (
            <Link
              href={`/${orgSlug}/persons/${personId}/lac/${record.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              Edit record
            </Link>
          )}
        </div>

        {/* Key details */}
        <div className="mt-4 pt-4 border-t border-[oklch(0.95_0.003_160)] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Legal status
            </dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {LAC_LEGAL_STATUS_LABELS[legalStatus] ?? legalStatus}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Status date
            </dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {formatDate(record.legalStatusDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Placing authority
            </dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {record.placingAuthority}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Admission date
            </dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {formatDate(record.admissionDate)}
            </dd>
          </div>
        </div>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContactCard
          title="Assigned Social Worker"
          name={record.socialWorkerName}
          email={record.socialWorkerEmail}
          phone={record.socialWorkerPhone}
        />
        <ContactCard
          title="Independent Reviewing Officer (IRO)"
          name={record.iroName}
          email={record.iroEmail}
          phone={record.iroPhone}
        />
      </div>
    </div>
  );
}
