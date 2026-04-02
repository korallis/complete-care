'use client';

import type { WelfareCheck } from '@/lib/db/schema/visit-tasks';
import { WELFARE_STATUS_CONFIG, type WelfareCheckStatus } from '../constants';

interface WelfareCheckPanelProps {
  checks: WelfareCheck[];
  onCheckIn: (id: string) => void;
  onResolve: (id: string, resolution: string, notes?: string) => void;
}

export function WelfareCheckPanel({
  checks,
  onCheckIn,
  onResolve,
}: WelfareCheckPanelProps) {
  const now = new Date();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Welfare Checks
      </h3>

      {checks.length === 0 ? (
        <p className="text-sm text-gray-500">No pending welfare checks.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {checks.map((check) => {
            const isOverdue =
              check.status === 'pending' &&
              new Date(check.expectedBy) < now;
            const statusConfig =
              WELFARE_STATUS_CONFIG[
                (isOverdue ? 'overdue' : check.status) as WelfareCheckStatus
              ];
            const expectedBy = new Date(check.expectedBy);

            return (
              <li key={check.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.colour}`}
                      >
                        {statusConfig.label}
                      </span>
                      {isOverdue && (
                        <span className="text-xs text-red-600 font-medium">
                          {Math.round(
                            (now.getTime() - expectedBy.getTime()) / 60000,
                          )}{' '}
                          min overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Expected by:{' '}
                      {expectedBy.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {check.resolution && (
                      <p className="text-xs text-gray-500">
                        Resolution: {check.resolution}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {check.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onCheckIn(check.id)}
                          className="rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
                        >
                          Check In
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onResolve(check.id, 'false_alarm')
                          }
                          className="rounded bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300"
                        >
                          False Alarm
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
