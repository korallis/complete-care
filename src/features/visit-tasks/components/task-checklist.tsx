'use client';

import { useState } from 'react';
import type { VisitTaskRecord as VisitTask } from '@/lib/db/schema/visit-tasks';
import { TaskStatusBadge } from './task-status-badge';
import { TASK_CATEGORY_CONFIG, type TaskCategory, type TaskStatus } from '../constants';

interface TaskChecklistProps {
  tasks: VisitTask[];
  onComplete: (taskId: string, timeSpentMinutes?: number, notes?: string) => void;
  onSkip: (taskId: string, reason: string, notes?: string) => void;
  disabled?: boolean;
}

export function TaskChecklist({
  tasks,
  onComplete,
  onSkip,
  disabled = false,
}: TaskChecklistProps) {
  const [skipReasons, setSkipReasons] = useState<Record<string, string>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round(((completedCount) / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Task Progress</span>
          <span>
            {completedCount}/{totalCount} ({percentage}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      <ul className="divide-y divide-gray-100">
        {tasks.map((task) => {
          const isExpanded = expandedTask === task.id;
          const categoryConfig = task.category
            ? TASK_CATEGORY_CONFIG[task.category as TaskCategory]
            : null;

          return (
            <li key={task.id} className="py-3">
              <div className="flex items-start gap-3">
                {/* Checkbox area */}
                <div className="pt-0.5">
                  {task.status === 'pending' ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onComplete(task.id)}
                      className="flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 disabled:opacity-50"
                      aria-label={`Complete task: ${task.title}`}
                    >
                      <span className="sr-only">Complete</span>
                    </button>
                  ) : task.status === 'completed' ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-green-500 text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        task.status !== 'pending' ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.isMandatory && (
                      <span className="text-xs text-red-600 font-medium">Required</span>
                    )}
                    {categoryConfig && (
                      <span className="text-xs text-gray-500">{categoryConfig.label}</span>
                    )}
                  </div>

                  {task.instructions && (
                    <p className="mt-0.5 text-xs text-gray-500">{task.instructions}</p>
                  )}

                  {task.status === 'skipped' && task.skipReason && (
                    <p className="mt-1 text-xs text-amber-600">
                      Skipped: {task.skipReason}
                    </p>
                  )}

                  {task.timeSpentMinutes != null && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      Time: {task.timeSpentMinutes} min
                    </p>
                  )}
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={task.status as TaskStatus} />
                  {task.status === 'pending' && !disabled && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTask(isExpanded ? null : task.id)
                      }
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>

              {/* Skip reason input */}
              {isExpanded && task.status === 'pending' && (
                <div className="mt-2 ml-8 flex gap-2">
                  <input
                    type="text"
                    placeholder="Reason for skipping..."
                    value={skipReasons[task.id] ?? ''}
                    onChange={(e) =>
                      setSkipReasons((prev) => ({
                        ...prev,
                        [task.id]: e.target.value,
                      }))
                    }
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    disabled={!skipReasons[task.id]?.trim()}
                    onClick={() => {
                      const reason = skipReasons[task.id]?.trim();
                      if (reason) {
                        onSkip(task.id, reason);
                        setExpandedTask(null);
                        setSkipReasons((prev) => {
                          const next = { ...prev };
                          delete next[task.id];
                          return next;
                        });
                      }
                    }}
                    className="rounded bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    Confirm Skip
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
