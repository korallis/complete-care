'use client';

import { Badge } from '@/components/ui/badge';
import type { ReferralStatus } from '../schema';

const STATUS_CONFIG: Record<
  ReferralStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  received: { label: 'Received', variant: 'outline' },
  assessment_complete: { label: 'Assessment Complete', variant: 'secondary' },
  accepted: { label: 'Accepted', variant: 'default' },
  declined: { label: 'Declined', variant: 'destructive' },
  admitted: { label: 'Admitted', variant: 'default' },
};

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: 'outline' as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
