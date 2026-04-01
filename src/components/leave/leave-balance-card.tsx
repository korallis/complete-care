'use client';

/**
 * LeaveBalanceCard -- displays remaining leave entitlement for a staff member.
 */

import type { LeaveBalance } from '@/lib/db/schema/leave';

type LeaveBalanceCardProps = {
  balance: LeaveBalance;
};

export function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
  const usedPercentage =
    balance.annualEntitlement > 0
      ? Math.round((balance.annualUsed / balance.annualEntitlement) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
        Leave Balance ({balance.year})
      </h3>

      {/* Annual leave */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-[oklch(0.45_0_0)]">Annual Leave</span>
            <span className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
              {balance.annualRemaining} / {balance.annualEntitlement} days remaining
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[oklch(0.94_0.005_160)]">
            <div
              className={`h-full rounded-full transition-all ${
                usedPercentage >= 90
                  ? 'bg-red-500'
                  : usedPercentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-[oklch(0.55_0.15_160)]'
              }`}
              style={{ width: `${Math.min(100, usedPercentage)}%` }}
            />
          </div>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
            {balance.annualUsed} days used ({usedPercentage}%)
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-lg bg-blue-50/80 p-3 text-center">
            <p className="text-lg font-bold text-blue-700">
              {balance.annualRemaining}
            </p>
            <p className="text-xs text-blue-600">Remaining</p>
          </div>
          <div className="rounded-lg bg-amber-50/80 p-3 text-center">
            <p className="text-lg font-bold text-amber-700">
              {balance.annualUsed}
            </p>
            <p className="text-xs text-amber-600">Used</p>
          </div>
          <div className="rounded-lg bg-orange-50/80 p-3 text-center">
            <p className="text-lg font-bold text-orange-700">
              {balance.sickDays}
            </p>
            <p className="text-xs text-orange-600">Sick Days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
