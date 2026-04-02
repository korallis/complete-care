'use client';

import { TASK_STATUS_CONFIG, type TaskStatus } from '../constants';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = TASK_STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.colour}`}
    >
      {config.label}
    </span>
  );
}
