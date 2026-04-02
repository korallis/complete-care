'use client';

import type { VisitTaskList, VisitTaskRecord as VisitTask } from '@/lib/db/schema/visit-tasks';
import { TASK_CATEGORY_CONFIG, type TaskCategory } from '../constants';

interface CompletionSummaryProps {
  taskList: VisitTaskList;
  tasks: VisitTask[];
}

export function CompletionSummary({ taskList, tasks }: CompletionSummaryProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const skippedTasks = tasks.filter((t) => t.status === 'skipped');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const mandatorySkipped = skippedTasks.filter((t) => t.isMandatory);

  const totalTimeSpent = completedTasks.reduce(
    (acc, t) => acc + (t.timeSpentMinutes ?? 0),
    0,
  );

  // Group by category
  const categoryBreakdown = tasks.reduce(
    (acc, task) => {
      const cat = (task.category ?? 'other') as TaskCategory;
      if (!acc[cat]) {
        acc[cat] = { total: 0, completed: 0, skipped: 0 };
      }
      acc[cat].total++;
      if (task.status === 'completed') acc[cat].completed++;
      if (task.status === 'skipped') acc[cat].skipped++;
      return acc;
    },
    {} as Record<string, { total: number; completed: number; skipped: number }>,
  );

  return (
    <div className="space-y-6">
      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">
            {taskList.completionPercentage}%
          </p>
          <p className="text-xs text-gray-500">Completion</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-600">
            {completedTasks.length}
          </p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-amber-600">
            {skippedTasks.length}
          </p>
          <p className="text-xs text-gray-500">Skipped</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-400">
            {pendingTasks.length}
          </p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>

      {/* Time summary */}
      {totalTimeSpent > 0 && (
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-900">
            Total time recorded: {totalTimeSpent} minutes
          </p>
        </div>
      )}

      {/* Mandatory skips warning */}
      {mandatorySkipped.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            {mandatorySkipped.length} mandatory task(s) were skipped
          </p>
          <ul className="mt-2 space-y-1">
            {mandatorySkipped.map((task) => (
              <li key={task.id} className="text-xs text-red-600">
                <span className="font-medium">{task.title}</span>:{' '}
                {task.skipReason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-900">
            By Category
          </h4>
          <div className="space-y-2">
            {Object.entries(categoryBreakdown).map(([cat, stats]) => {
              const config =
                TASK_CATEGORY_CONFIG[cat as TaskCategory] ??
                TASK_CATEGORY_CONFIG.other;
              const pct =
                stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0;

              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-gray-600">
                    {config.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {stats.completed}/{stats.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
