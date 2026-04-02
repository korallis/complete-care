'use client';

import type { EolCarePlanStatus } from '../types';

const STATUS_STYLES: Record<EolCarePlanStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  reviewed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
};

interface EolCarePlanSummary {
  id: string;
  personName: string;
  preferredPlaceOfDeath: string | null;
  dnacprInPlace: boolean;
  respectFormCompleted: boolean;
  status: EolCarePlanStatus;
  updatedAt: string;
}

export function EolCarePlanList({ plans }: { plans: EolCarePlanSummary[] }) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No end-of-life care plans yet.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a care plan to capture preferences and advance decisions.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-4 py-3 font-medium">Person</th>
            <th className="px-4 py-3 font-medium">Preferred Place</th>
            <th className="px-4 py-3 font-medium">DNACPR</th>
            <th className="px-4 py-3 font-medium">ReSPECT</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="border-b hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{plan.personName}</td>
              <td className="px-4 py-3 capitalize">
                {plan.preferredPlaceOfDeath?.replace('_', ' ') ?? '--'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${plan.dnacprInPlace ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${plan.respectFormCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[plan.status]}`}
                >
                  {plan.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{plan.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
