'use client';

/**
 * ChildrensRegister — Schedule 4 compliant register table.
 *
 * Displays all children with admission/discharge dates, legal status,
 * placing authority, social worker details, and emergency contacts.
 */

import { useMemo, useState } from 'react';
import type { ChildrensRegisterEntry } from '@/lib/db/schema/ofsted';
import { LEGAL_STATUS_LABELS } from '@/features/ofsted/constants';
import type { LegalStatus } from '@/features/ofsted/constants';

type RegisterFilter = 'current' | 'departed' | 'all';

interface ChildrensRegisterProps {
  entries: ChildrensRegisterEntry[];
  /** Map of personId -> person name for display */
  personNames: Record<string, string>;
  canManage: boolean;
  orgSlug: string;
}

function StatusDot({ discharged }: { discharged: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        discharged ? 'bg-gray-400' : 'bg-emerald-500'
      }`}
      title={discharged ? 'Discharged' : 'Current resident'}
    />
  );
}

export function ChildrensRegister({
  entries,
  personNames,
}: ChildrensRegisterProps) {
  const [filter, setFilter] = useState<RegisterFilter>('current');

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    if (filter === 'departed') return entries.filter((entry) => Boolean(entry.dischargeDate));
    return entries.filter((entry) => !entry.dischargeDate);
  }, [entries, filter]);

  const counts = useMemo(
    () => ({
      current: entries.filter((entry) => !entry.dischargeDate).length,
      departed: entries.filter((entry) => Boolean(entry.dischargeDate)).length,
      all: entries.length,
    }),
    [entries],
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.85_0.003_160)] p-8 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No children registered yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {([
          ['current', 'Current residents'],
          ['departed', 'Departed'],
          ['all', 'All entries'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === value
                ? 'border-[oklch(0.35_0.06_160)] bg-[oklch(0.95_0.02_160)] text-[oklch(0.25_0.05_160)]'
                : 'border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.55_0_0)] hover:bg-[oklch(0.98_0.003_160)]'
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[oklch(0.85_0.003_160)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[oklch(0.90_0.003_160)] bg-[oklch(0.97_0.003_160)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.45_0_0)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.45_0_0)] uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.45_0_0)] uppercase tracking-wider">
                Admitted
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.45_0_0)] uppercase tracking-wider">
                Discharged
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.45_0_0)] uppercase tracking-wider">
                Legal Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.45_0_0)] uppercase tracking-wider">
                Placing Authority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.45_0_0)] uppercase tracking-wider">
                Social Worker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.45_0_0)] uppercase tracking-wider">
                Emergency Contact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[oklch(0.93_0.003_160)]">
            {filteredEntries.map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-[oklch(0.98_0.003_160)] transition-colors"
              >
                <td className="px-4 py-3">
                  <StatusDot discharged={!!entry.dischargeDate} />
                </td>
                <td className="px-4 py-3 font-medium text-[oklch(0.22_0.04_160)]">
                  {personNames[entry.personId] ?? 'Unknown'}
                </td>
                <td className="px-4 py-3 text-[oklch(0.45_0_0)]">
                  {entry.admissionDate}
                </td>
                <td className="px-4 py-3 text-[oklch(0.45_0_0)]">
                  {entry.dischargeDate ?? '--'}
                </td>
                <td className="px-4 py-3 text-[oklch(0.45_0_0)]">
                  {LEGAL_STATUS_LABELS[entry.legalStatus as LegalStatus] ??
                    entry.legalStatus}
                </td>
                <td className="px-4 py-3 text-[oklch(0.45_0_0)]">
                  {entry.placingAuthority}
                </td>
                <td className="px-4 py-3">
                  <div className="text-[oklch(0.35_0_0)]">
                    {entry.socialWorkerName ?? '--'}
                  </div>
                  {entry.socialWorkerPhone && (
                    <div className="text-xs text-[oklch(0.55_0_0)]">
                      {entry.socialWorkerPhone}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {entry.emergencyContact &&
                  typeof entry.emergencyContact === 'object' &&
                  'name' in entry.emergencyContact ? (
                    <div>
                      <div className="text-[oklch(0.35_0_0)]">
                        {entry.emergencyContact.name}
                      </div>
                      <div className="text-xs text-[oklch(0.55_0_0)]">
                        {entry.emergencyContact.phone}
                      </div>
                    </div>
                  ) : (
                    '--'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredEntries.length === 0 && (
        <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-5 text-sm text-[oklch(0.55_0_0)]">
          No {filter === 'departed' ? 'departed' : filter === 'all' ? '' : 'current'} register entries match this filter.
        </div>
      )}
    </div>
  );
}
