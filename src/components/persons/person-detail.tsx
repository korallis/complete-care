'use client';

/**
 * PersonDetail — client component for the person detail page.
 * Handles tab navigation and actions.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PersonAvatar } from './person-avatar';
import { PersonTypeBadge, PersonStatusBadge } from './person-type-badge';
import { calculateAge, formatDateOfBirth, formatNhsNumber } from '@/features/persons/utils';
import type { Person } from '@/lib/db/schema/persons';
import type { PersonTerminology } from '@/features/persons/utils';
import type { EmergencyContact } from '@/lib/db/schema/persons';

type Tab = 'overview' | 'care-plans' | 'notes' | 'assessments' | 'documents' | 'timeline';

type PersonDetailProps = {
  person: Person;
  orgSlug: string;
  terminology: PersonTerminology;
  canEdit: boolean;
  onArchive?: () => Promise<void>;
  onRestore?: () => Promise<void>;
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'care-plans', label: 'Care Plans' },
  { id: 'notes', label: 'Notes' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline', label: 'Timeline' },
];

function TabContent({ tab, person, orgSlug }: { tab: Tab; person: Person; orgSlug: string }) {
  if (tab === 'overview') {
    const emergencyContacts = (person.emergencyContacts ?? []) as EmergencyContact[];
    const age = calculateAge(person.dateOfBirth);
    const hasAllergies = person.allergies.length > 0;

    return (
      <div className="space-y-6">
        {/* Allergy alert */}
        {hasAllergies && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Known allergies ({person.allergies.length})
                </p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {person.allergies.map((a) => (
                    <li
                      key={a}
                      className="rounded-full border border-red-300 bg-white px-2.5 py-0.5 text-xs font-medium text-red-700"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal info */}
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
              Personal information
            </h3>
            <dl className="space-y-3">
              <InfoRow label="Full name" value={person.fullName} />
              {person.preferredName && person.preferredName !== person.fullName && (
                <InfoRow label="Known as" value={person.preferredName} />
              )}
              <InfoRow
                label="Date of birth"
                value={
                  person.dateOfBirth
                    ? `${formatDateOfBirth(person.dateOfBirth)}${age !== null ? ` (${age} years)` : ''}`
                    : null
                }
              />
              <InfoRow label="Gender" value={person.gender} />
              <InfoRow label="Ethnicity" value={person.ethnicity} />
              <InfoRow label="Religion" value={person.religion} />
              <InfoRow label="First language" value={person.firstLanguage} />
            </dl>
          </div>

          {/* Medical info */}
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
              Medical information
            </h3>
            <dl className="space-y-3">
              <InfoRow label="NHS number" value={person.nhsNumber ? formatNhsNumber(person.nhsNumber) : null} mono />
              <InfoRow label="GP" value={person.gpName} />
              <InfoRow label="GP practice" value={person.gpPractice} />
              {person.medicalConditions.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-[oklch(0.55_0_0)] mb-1">
                    Medical conditions
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {person.medicalConditions.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-[oklch(0.88_0.005_160)] bg-[oklch(0.97_0.003_160)] px-2.5 py-0.5 text-xs text-[oklch(0.35_0.04_160)]"
                      >
                        {c}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Contact info */}
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
              Contact details
            </h3>
            <dl className="space-y-3">
              <InfoRow label="Phone" value={person.contactPhone} />
              <InfoRow label="Email" value={person.contactEmail} />
              <InfoRow label="Address" value={person.address} />
            </dl>
          </div>

          {/* Emergency contacts */}
          {emergencyContacts.length > 0 && (
            <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
              <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
                Emergency contacts
              </h3>
              <ul className="space-y-4">
                {[...emergencyContacts]
                  .sort((a, b) => a.priority - b.priority)
                  .map((contact, i) => (
                    <li key={contact.id ?? i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[oklch(0.22_0.04_160)/0.1] flex items-center justify-center text-xs font-semibold text-[oklch(0.22_0.04_160)]">
                        {contact.priority}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                          {contact.name}
                          {contact.priority === 1 && (
                            <span className="ml-2 text-xs font-normal text-[oklch(0.55_0_0)]">
                              (Primary)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[oklch(0.55_0_0)]">
                          {contact.relationship}
                        </p>
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-xs text-[oklch(0.35_0.06_160)] hover:underline"
                        >
                          {contact.phone}
                        </a>
                        {contact.email && (
                          <p className="text-xs text-[oklch(0.55_0_0)]">
                            {contact.email}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Care plans tab — link to the dedicated care plans page
  if (tab === 'care-plans') {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-10 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
          <svg className="h-5 w-5 text-[oklch(0.45_0.07_160)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] mb-1">Care Plans</p>
        <p className="text-sm text-[oklch(0.55_0_0)] mb-4">
          View, create and manage version-controlled care plans for this person.
        </p>
        <Link
          href={`/${orgSlug}/persons/${person.id}/care-plans`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Open care plans
        </Link>
      </div>
    );
  }

  // Placeholder tabs — to be implemented in future features
  const placeholders: Record<Exclude<Tab, 'overview' | 'care-plans'>, string> = {
    notes: 'Care notes and timeline entries will appear here.',
    assessments: 'Risk assessments and scored evaluations will appear here.',
    documents: 'Uploaded documents and attachments will appear here.',
    timeline: 'Full activity timeline will appear here.',
  };

  return (
    <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
      <p className="text-sm text-[oklch(0.55_0_0)]">
        {placeholders[tab]}
      </p>
    </div>
  );
}

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
        {value ?? '—'}
      </dd>
    </div>
  );
}

export function PersonDetail({
  person,
  orgSlug,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  terminology,
  canEdit,
  onArchive,
  onRestore,
}: PersonDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const hasAllergies = person.allergies.length > 0;

  const handleArchive = () => {
    if (!onArchive) return;
    startTransition(async () => {
      await onArchive();
      router.refresh();
    });
  };

  const handleRestore = () => {
    if (!onRestore) return;
    startTransition(async () => {
      await onRestore();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Person header */}
      <div className="rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <PersonAvatar
              fullName={person.fullName}
              photoUrl={person.photoUrl}
              size="xl"
              hasAllergies={hasAllergies}
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)] truncate">
                    {person.fullName}
                    {person.preferredName && person.preferredName !== person.fullName && (
                      <span className="ml-2 text-lg font-normal text-[oklch(0.55_0_0)]">
                        ({person.preferredName})
                      </span>
                    )}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <PersonTypeBadge type={person.type} />
                    <PersonStatusBadge status={person.status} />
                    {person.dateOfBirth && (
                      <span className="text-sm text-[oklch(0.6_0_0)]">
                        Age {calculateAge(person.dateOfBirth) ?? '—'}
                      </span>
                    )}
                    {person.nhsNumber && (
                      <span className="text-sm font-mono text-[oklch(0.6_0_0)]">
                        NHS: {formatNhsNumber(person.nhsNumber)}
                      </span>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/${orgSlug}/persons/${person.id}/edit`}
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

                    {person.status === 'active' && onArchive && (
                      <button
                        type="button"
                        onClick={handleArchive}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-2 text-sm font-medium text-[oklch(0.55_0_0)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                      >
                        Archive
                      </button>
                    )}
                    {person.status === 'archived' && onRestore && (
                      <button
                        type="button"
                        onClick={handleRestore}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-2 text-sm font-medium text-[oklch(0.35_0.06_160)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="border-t border-[oklch(0.91_0.005_160)] px-6 overflow-x-auto"
          role="tablist"
          aria-label="Person record sections"
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
        <TabContent tab={activeTab} person={person} orgSlug={orgSlug} />
      </div>
    </div>
  );
}
