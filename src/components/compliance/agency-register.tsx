'use client';

/**
 * AgencyRegister -- Agency list with worker counts and contract details.
 */

import { useState } from 'react';
import type { AgencyListItem } from '@/features/compliance/actions';

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-emerald-500' : 'bg-gray-400'
        }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

interface AgencyRegisterProps {
  agencies: AgencyListItem[];
  canManage: boolean;
}

export function AgencyRegister({ agencies }: AgencyRegisterProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered =
    filter === 'all'
      ? agencies
      : agencies.filter((a) => a.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex items-center gap-2">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[oklch(0.22_0.04_160)] text-white'
                : 'bg-[oklch(0.95_0.003_160)] text-[oklch(0.45_0_0)] hover:bg-[oklch(0.90_0.003_160)]'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[oklch(0.55_0_0)]">
          <p className="text-lg font-medium">No agencies found</p>
          <p className="text-sm mt-1">
            {filter !== 'all'
              ? `No ${filter} agencies. Try a different filter.`
              : 'Add agencies to your approved register.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[oklch(0.90_0.003_160)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.90_0.003_160)] bg-[oklch(0.97_0.003_160)]">
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
                  Agency
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.45_0_0)]">
                  Contract Period
                </th>
                <th className="px-4 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
                  Workers
                </th>
                <th className="px-4 py-3 text-center font-medium text-[oklch(0.45_0_0)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agency) => (
                <tr
                  key={agency.id}
                  className="border-b border-[oklch(0.94_0.003_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[oklch(0.22_0.04_160)]">
                    {agency.agencyName}
                  </td>
                  <td className="px-4 py-3 text-[oklch(0.55_0_0)]">
                    <div>
                      {agency.contactEmail && (
                        <span className="block text-xs">
                          {agency.contactEmail}
                        </span>
                      )}
                      {agency.contactPhone && (
                        <span className="block text-xs">
                          {agency.contactPhone}
                        </span>
                      )}
                      {!agency.contactEmail && !agency.contactPhone && (
                        <span className="text-xs italic">No contact</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[oklch(0.55_0_0)] text-xs">
                    {agency.contractStart || agency.contractEnd
                      ? `${agency.contractStart ?? '?'} - ${agency.contractEnd ?? 'ongoing'}`
                      : 'Not specified'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-[oklch(0.93_0.003_160)] text-xs font-medium text-[oklch(0.45_0_0)]">
                      {agency.workerCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={agency.status} />
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
