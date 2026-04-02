'use client';

/**
 * Outcomes dashboard — client component that composes all outcome widgets.
 * Once auth/data layer is wired, server actions will populate real data.
 * Currently renders with empty states for type-safe scaffolding.
 */

import {
  TrafficLightSummary,
  GoalsList,
  SkillsProgressChart,
  CommunityAccessLog,
  SupportHoursChart,
} from '@/features/outcomes/components';
import type { TrafficLightData } from '@/features/outcomes/components';
import type { Goal, CommunityAccess, SupportHour } from '@/lib/db/schema/outcomes';

// ---------------------------------------------------------------------------
// Dashboard sections
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export function OutcomesDashboard({
  orgSlug,
  personId,
}: {
  orgSlug: string;
  personId: string;
}) {
  // Placeholder data — will be replaced with server action calls once auth context exists.
  // orgSlug and personId will be passed to server actions for data fetching.
  void orgSlug;
  void personId;
  const trafficLightData: TrafficLightData = {
    red: 0,
    amber: 0,
    green: 0,
    unreviewed: 0,
  };

  const goals: (Goal & { latestReviewStatus?: 'red' | 'amber' | 'green' | null })[] = [];
  const communityRecords: CommunityAccess[] = [];
  const supportRecords: SupportHour[] = [];

  return (
    <div className="space-y-6">
      {/* Traffic-light overview */}
      <SectionCard title="Goal Progress Overview">
        <TrafficLightSummary data={trafficLightData} />
      </SectionCard>

      {/* Two-column layout for goals + skills */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="SMART Goals">
          <GoalsList goals={goals} />
        </SectionCard>

        <SectionCard title="Skills Development">
          <SkillsProgressChart domains={[]} />
        </SectionCard>
      </div>

      {/* Two-column layout for community + support */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Community Access">
          <CommunityAccessLog records={communityRecords} />
        </SectionCard>

        <SectionCard title="Support Hours">
          <SupportHoursChart records={supportRecords} />
        </SectionCard>
      </div>
    </div>
  );
}
