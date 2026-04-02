'use client';

import type { SupportedLivingPortalView } from '../../types';

interface SupportedLivingViewProps {
  view: SupportedLivingPortalView;
  sections: { key: string; title: string; description: string }[];
}

/**
 * Supported living portal view — goals progress, community activities, support hours.
 */
export function SupportedLivingView({
  view,
  sections,
}: SupportedLivingViewProps) {
  return (
    <>
      {/* Goals Progress */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[0].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[0].description}
        </p>
        {view.goalsProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No goals recorded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.goalsProgress.map((goal) => (
              <li key={goal.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{goal.goalTitle}</span>
                  <span className="text-muted-foreground">
                    {goal.progressPercentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                  />
                </div>
                {goal.notes && (
                  <p className="mt-1 text-muted-foreground">{goal.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Community Activities */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[1].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[1].description}
        </p>
        {view.communityActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No community activities scheduled.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.communityActivities.map((activity) => (
              <li
                key={activity.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{activity.activityName}</span>
                  <span className="text-muted-foreground">
                    {' '}&middot; {activity.location}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {activity.scheduledAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Support Hours */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">{sections[2].title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {sections[2].description}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Weekly allocated</span>
            <span className="font-medium">
              {view.supportHoursSummary.weeklyAllocated}h
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Weekly used</span>
            <span className="font-medium">
              {view.supportHoursSummary.weeklyUsed}h
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{
                width: `${
                  view.supportHoursSummary.weeklyAllocated > 0
                    ? Math.min(
                        (view.supportHoursSummary.weeklyUsed /
                          view.supportHoursSummary.weeklyAllocated) *
                          100,
                        100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
