/**
 * StaffStatusBadge — displays the employment status of a staff member.
 * StaffContractBadge — displays the contract type.
 */

import { STATUS_STYLES, CONTRACT_TYPE_STYLES } from '@/features/staff/constants';
import { STATUS_LABELS, CONTRACT_TYPE_LABELS } from '@/features/staff/schema';
import type { StaffStatus, StaffContractType } from '@/features/staff/schema';

export function StaffStatusBadge({ status }: { status: string }) {
  const s = status as StaffStatus;
  const style = STATUS_STYLES[s] ?? STATUS_STYLES.active;
  const label = STATUS_LABELS[s] ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function StaffContractBadge({ contractType }: { contractType: string }) {
  const ct = contractType as StaffContractType;
  const style = CONTRACT_TYPE_STYLES[ct] ?? CONTRACT_TYPE_STYLES.full_time;
  const label = CONTRACT_TYPE_LABELS[ct] ?? contractType;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
}
