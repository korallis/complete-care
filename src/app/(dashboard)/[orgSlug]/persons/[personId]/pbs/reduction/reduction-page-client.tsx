'use client';

import { useState } from 'react';
import { ReductionDashboard } from '@/features/pbs/components';

interface Props {
  personId: string;
}

// Demo data — in production this comes from getRestrictivePracticeCounts server action
const DEMO_DATA = [
  { period: '2026-01-05', count: 8 },
  { period: '2026-01-12', count: 6 },
  { period: '2026-01-19', count: 7 },
  { period: '2026-01-26', count: 5 },
  { period: '2026-02-02', count: 4 },
  { period: '2026-02-09', count: 5 },
  { period: '2026-02-16', count: 3 },
  { period: '2026-02-23', count: 2 },
  { period: '2026-03-02', count: 3 },
  { period: '2026-03-09', count: 2 },
  { period: '2026-03-16', count: 1 },
  { period: '2026-03-23', count: 2 },
];

export function ReductionPageClient({ personId }: Props) {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>(
    'weekly',
  );

  // In production: call getRestrictivePracticeCounts(personId, period) server action
  // and use the returned data instead of DEMO_DATA.
  // personId will be passed to the server action when wired up.
  void personId;

  return (
    <ReductionDashboard
      data={DEMO_DATA}
      period={period}
      onPeriodChange={setPeriod}
      reductionPlan="1. Increase use of proactive strategies during transitions — target 50% reduction in physical interventions by Q2 2026.\n2. Staff training refresher on de-escalation techniques scheduled monthly.\n3. Environmental adjustments to sensory room completed.\n4. Weekly MDT review of all incidents to identify emerging patterns."
    />
  );
}
