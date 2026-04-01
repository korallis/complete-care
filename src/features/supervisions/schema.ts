/**
 * Supervision validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUPERVISION_TYPES = ['supervision', 'appraisal'] as const;

export type SupervisionType = (typeof SUPERVISION_TYPES)[number];

export const SUPERVISION_TYPE_LABELS: Record<SupervisionType, string> = {
  supervision: 'Supervision',
  appraisal: 'Appraisal',
};

export const SUPERVISION_FREQUENCIES = [
  'monthly',
  'six_weekly',
  'quarterly',
  'annual',
] as const;

export type SupervisionFrequency = (typeof SUPERVISION_FREQUENCIES)[number];

export const SUPERVISION_FREQUENCY_LABELS: Record<SupervisionFrequency, string> = {
  monthly: 'Monthly',
  six_weekly: '6-Weekly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

export const SUPERVISION_STATUSES = [
  'scheduled',
  'completed',
  'overdue',
  'cancelled',
] as const;

export type SupervisionStatus = (typeof SUPERVISION_STATUSES)[number];

export const SUPERVISION_STATUS_LABELS: Record<SupervisionStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const GOAL_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

// ---------------------------------------------------------------------------
// Date validation helper
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Development goal entry schema
// ---------------------------------------------------------------------------

export const developmentGoalSchema = z.object({
  id: z.string().min(1),
  goal: z.string().min(1, 'Goal description is required').max(1000),
  targetDate: z
    .string()
    .regex(DATE_REGEX, 'Target date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  status: z.enum(GOAL_STATUSES).default('not_started'),
  notes: z.string().max(2000).nullable().optional(),
});

export type DevelopmentGoalInput = z.infer<typeof developmentGoalSchema>;

// ---------------------------------------------------------------------------
// Action agreed entry schema
// ---------------------------------------------------------------------------

export const actionAgreedSchema = z.object({
  id: z.string().min(1),
  action: z.string().min(1, 'Action description is required').max(1000),
  assigneeId: z.string().uuid().nullable().optional(),
  assigneeName: z.string().max(255).nullable().optional(),
  deadline: z
    .string()
    .regex(DATE_REGEX, 'Deadline must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  completed: z.boolean().default(false),
});

export type ActionAgreedInput = z.infer<typeof actionAgreedSchema>;

// ---------------------------------------------------------------------------
// Schedule supervision schema
// ---------------------------------------------------------------------------

export const scheduleSupervisionSchema = z.object({
  staffProfileId: z.string().uuid('Invalid staff profile ID'),
  supervisorId: z.string().uuid('Invalid supervisor ID'),
  scheduledDate: z
    .string()
    .regex(DATE_REGEX, 'Scheduled date must be in YYYY-MM-DD format'),
  type: z.enum(SUPERVISION_TYPES).default('supervision'),
  frequency: z.enum(SUPERVISION_FREQUENCIES).default('monthly'),
});

export type ScheduleSupervisionInput = z.infer<typeof scheduleSupervisionSchema>;

// ---------------------------------------------------------------------------
// Complete supervision schema
// ---------------------------------------------------------------------------

export const completeSupervisionSchema = z.object({
  workloadDiscussion: z
    .string()
    .max(5000, 'Workload discussion must be 5000 characters or fewer')
    .optional()
    .nullable(),
  wellbeingCheck: z
    .string()
    .max(5000, 'Wellbeing check must be 5000 characters or fewer')
    .optional()
    .nullable(),
  developmentGoals: z.array(developmentGoalSchema).default([]),
  concernsRaised: z
    .string()
    .max(5000, 'Concerns must be 5000 characters or fewer')
    .optional()
    .nullable(),
  actionsAgreed: z.array(actionAgreedSchema).default([]),
});

export type CompleteSupervisionInput = z.infer<typeof completeSupervisionSchema>;

// ---------------------------------------------------------------------------
// Update supervision schema (partial, for editing scheduled or completed)
// ---------------------------------------------------------------------------

export const updateSupervisionSchema = z.object({
  scheduledDate: z
    .string()
    .regex(DATE_REGEX, 'Scheduled date must be in YYYY-MM-DD format')
    .optional(),
  supervisorId: z.string().uuid('Invalid supervisor ID').optional(),
  type: z.enum(SUPERVISION_TYPES).optional(),
  frequency: z.enum(SUPERVISION_FREQUENCIES).optional(),
  status: z.enum(SUPERVISION_STATUSES).optional(),
  workloadDiscussion: z
    .string()
    .max(5000)
    .optional()
    .nullable(),
  wellbeingCheck: z
    .string()
    .max(5000)
    .optional()
    .nullable(),
  developmentGoals: z.array(developmentGoalSchema).optional(),
  concernsRaised: z
    .string()
    .max(5000)
    .optional()
    .nullable(),
  actionsAgreed: z.array(actionAgreedSchema).optional(),
});

export type UpdateSupervisionInput = z.infer<typeof updateSupervisionSchema>;

// ---------------------------------------------------------------------------
// Status computation helpers
// ---------------------------------------------------------------------------

/**
 * Computes the supervision status based on scheduled date and completion.
 *
 * - completed: completedDate is set
 * - overdue: scheduled date is in the past and not completed
 * - scheduled: scheduled date is in the future
 */
export function computeSupervisionStatus(
  scheduledDate: string,
  completedDate: string | null,
): SupervisionStatus {
  if (completedDate) return 'completed';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);

  if (scheduled < today) return 'overdue';

  return 'scheduled';
}

/**
 * Calculates the next due date based on the current scheduled date and frequency.
 */
export function calculateNextDueDate(
  currentDate: string,
  frequency: SupervisionFrequency,
): string {
  const d = new Date(currentDate);

  switch (frequency) {
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'six_weekly':
      d.setDate(d.getDate() + 42);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'annual':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }

  return d.toISOString().slice(0, 10);
}

/**
 * Returns days until the scheduled date. Negative = overdue.
 */
export function daysUntilSupervision(scheduledDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);
  const diffMs = scheduled.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
