'use client';

import { useState } from 'react';
import { List, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatsCards } from '@/features/evv/components/stats-cards';
import { VisitMap } from '@/features/evv/components/visit-map';
import { VisitList } from '@/features/evv/components/visit-list';
import { AlertPanel } from '@/features/evv/components/alert-panel';
import type { VisitStatus, VisitType, AlertSeverity, AlertType } from '@/features/evv/constants';

// ---------------------------------------------------------------------------
// Demo data — replaced by server actions + real data in production
// ---------------------------------------------------------------------------

const DEMO_VISITS: Array<{
  id: string;
  clientName: string;
  carerName: string;
  clientAddress: string;
  status: VisitStatus;
  visitType: VisitType;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  actualDurationMinutes: number | null;
  expectedLatitude: number;
  expectedLongitude: number;
}> = [
  {
    id: '1',
    clientName: 'Margaret Thompson',
    carerName: 'Sarah Williams',
    clientAddress: '14 Elm Close, Bristol BS1 4DJ',
    status: 'in_progress',
    visitType: 'personal_care',
    scheduledStart: new Date(new Date().setHours(9, 0, 0, 0)),
    scheduledEnd: new Date(new Date().setHours(10, 0, 0, 0)),
    actualStart: new Date(new Date().setHours(9, 5, 0, 0)),
    actualEnd: null,
    actualDurationMinutes: null,
    expectedLatitude: 51.455,
    expectedLongitude: -2.597,
  },
  {
    id: '2',
    clientName: 'Albert Jenkins',
    carerName: 'David Chen',
    clientAddress: '7 Park Lane, Bristol BS2 8EA',
    status: 'completed',
    visitType: 'medication',
    scheduledStart: new Date(new Date().setHours(8, 0, 0, 0)),
    scheduledEnd: new Date(new Date().setHours(8, 30, 0, 0)),
    actualStart: new Date(new Date().setHours(7, 58, 0, 0)),
    actualEnd: new Date(new Date().setHours(8, 25, 0, 0)),
    actualDurationMinutes: 27,
    expectedLatitude: 51.462,
    expectedLongitude: -2.583,
  },
  {
    id: '3',
    clientName: 'Dorothy Clark',
    carerName: 'Emma Roberts',
    clientAddress: '22 Queens Road, Bristol BS8 1QU',
    status: 'scheduled',
    visitType: 'wellness_check',
    scheduledStart: new Date(new Date().setHours(11, 0, 0, 0)),
    scheduledEnd: new Date(new Date().setHours(11, 45, 0, 0)),
    actualStart: null,
    actualEnd: null,
    actualDurationMinutes: null,
    expectedLatitude: 51.458,
    expectedLongitude: -2.613,
  },
  {
    id: '4',
    clientName: 'Harold Patel',
    carerName: 'Sarah Williams',
    clientAddress: '9 Temple Street, Bristol BS1 6QA',
    status: 'missed',
    visitType: 'meal_prep',
    scheduledStart: new Date(new Date().setHours(7, 0, 0, 0)),
    scheduledEnd: new Date(new Date().setHours(7, 45, 0, 0)),
    actualStart: null,
    actualEnd: null,
    actualDurationMinutes: null,
    expectedLatitude: 51.451,
    expectedLongitude: -2.589,
  },
  {
    id: '5',
    clientName: 'Joan Murray',
    carerName: 'James Okafor',
    clientAddress: '31 Whiteladies Road, Bristol BS8 2LY',
    status: 'scheduled',
    visitType: 'personal_care',
    scheduledStart: new Date(new Date().setHours(14, 0, 0, 0)),
    scheduledEnd: new Date(new Date().setHours(15, 0, 0, 0)),
    actualStart: null,
    actualEnd: null,
    actualDurationMinutes: null,
    expectedLatitude: 51.468,
    expectedLongitude: -2.609,
  },
];

const DEMO_ALERTS: Array<{
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  status: string;
  minutesOverdue: number | null;
  escalated: boolean;
  createdAt: Date;
}> = [
  {
    id: 'a1',
    alertType: 'missed',
    severity: 'critical',
    message: 'Visit to Harold Patel was missed. 180 minutes overdue.',
    status: 'active',
    minutesOverdue: 180,
    escalated: true,
    createdAt: new Date(Date.now() - 45 * 60_000),
  },
  {
    id: 'a2',
    alertType: 'late_start',
    severity: 'medium',
    message: 'Visit to Margaret Thompson started 5 minutes late.',
    status: 'active',
    minutesOverdue: 5,
    escalated: false,
    createdAt: new Date(Date.now() - 20 * 60_000),
  },
];

// ---------------------------------------------------------------------------
// Dashboard component
// ---------------------------------------------------------------------------

type ViewMode = 'map' | 'list';

interface EvvDashboardProps {
  orgSlug: string;
}

export function EvvDashboard({ orgSlug: _orgSlug }: EvvDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // In production, replace with real data from server actions
  const visits = DEMO_VISITS;
  const alerts = DEMO_ALERTS;

  const stats = {
    total: visits.length,
    scheduled: visits.filter((v) => v.status === 'scheduled').length,
    inProgress: visits.filter((v) => v.status === 'in_progress').length,
    completed: visits.filter((v) => v.status === 'completed').length,
    missed: visits.filter((v) => v.status === 'missed').length,
    cancelled: visits.filter((v) => v.status === 'cancelled').length,
  };

  const alertStats = {
    activeAlerts: alerts.filter((a) => a.status === 'active').length,
    escalatedAlerts: alerts.filter((a) => a.escalated).length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Visit Verification
          </h1>
          <p className="text-xs text-muted-foreground">
            Electronic Visit Verification &middot; {new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(new Date())}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'map'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5">
        <StatsCards visits={stats} alerts={alertStats} />
      </div>

      {/* Main content */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          {viewMode === 'map' ? (
            <VisitMap visits={visits} className="h-[500px]" />
          ) : (
            <VisitList visits={visits} />
          )}
        </div>

        {/* Sidebar — alerts */}
        <AlertPanel alerts={alerts} />
      </div>
    </div>
  );
}
