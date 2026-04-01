'use client';

/**
 * SupervisionForm — structured supervision template form.
 *
 * Two modes:
 * - "schedule": just date, supervisor, type, frequency
 * - "complete": full template with workload, wellbeing, goals, concerns, actions
 */

import { useState } from 'react';
import {
  SUPERVISION_TYPES,
  SUPERVISION_TYPE_LABELS,
  SUPERVISION_FREQUENCIES,
  SUPERVISION_FREQUENCY_LABELS,
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
} from '@/features/supervisions/schema';
import type {
  ScheduleSupervisionInput,
  CompleteSupervisionInput,
  DevelopmentGoalInput,
  ActionAgreedInput,
} from '@/features/supervisions/schema';
import type { StaffOption } from '@/features/supervisions/actions';

// ---------------------------------------------------------------------------
// Schedule form
// ---------------------------------------------------------------------------

type ScheduleFormProps = {
  staffProfileId: string;
  staffOptions: StaffOption[];
  onSubmit: (data: ScheduleSupervisionInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  initialData?: {
    supervisorId?: string;
    scheduledDate?: string;
    type?: string;
    frequency?: string;
  };
};

export function ScheduleSupervisionForm({
  staffProfileId,
  staffOptions,
  onSubmit,
  onCancel,
  initialData,
}: ScheduleFormProps) {
  const [supervisorId, setSupervisorId] = useState(initialData?.supervisorId ?? '');
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate ?? '');
  const [type, setType] = useState(initialData?.type ?? 'supervision');
  const [frequency, setFrequency] = useState(initialData?.frequency ?? 'monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        staffProfileId,
        supervisorId,
        scheduledDate,
        type: type as ScheduleSupervisionInput['type'],
        frequency: frequency as ScheduleSupervisionInput['frequency'],
      });

      if (!result.success) {
        setError(result.error ?? 'Failed to schedule supervision');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="supervisorId" className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1">
            Supervisor
          </label>
          <select
            id="supervisorId"
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
            required
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.1_160)]/25"
          >
            <option value="">Select supervisor...</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.jobTitle})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scheduledDate" className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1">
            Scheduled date
          </label>
          <input
            id="scheduledDate"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.1_160)]/25"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.1_160)]/25"
          >
            {SUPERVISION_TYPES.map((t) => (
              <option key={t} value={t}>
                {SUPERVISION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1">
            Frequency
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.1_160)]/25"
          >
            {SUPERVISION_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {SUPERVISION_FREQUENCY_LABELS[f]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.45_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[oklch(0.35_0.06_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Complete form — full supervision template
// ---------------------------------------------------------------------------

type CompleteFormProps = {
  supervisionId: string;
  staffOptions: StaffOption[];
  onSubmit: (data: CompleteSupervisionInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  initialData?: Partial<CompleteSupervisionInput>;
};

export function CompleteSupervisionForm({
  staffOptions,
  onSubmit,
  onCancel,
  initialData,
}: CompleteFormProps) {
  const [workloadDiscussion, setWorkloadDiscussion] = useState(
    initialData?.workloadDiscussion ?? '',
  );
  const [wellbeingCheck, setWellbeingCheck] = useState(
    initialData?.wellbeingCheck ?? '',
  );
  const [concernsRaised, setConcernsRaised] = useState(
    initialData?.concernsRaised ?? '',
  );
  const [goals, setGoals] = useState<DevelopmentGoalInput[]>(
    initialData?.developmentGoals ?? [],
  );
  const [actions, setActions] = useState<ActionAgreedInput[]>(
    initialData?.actionsAgreed ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addGoal = () => {
    setGoals([
      ...goals,
      {
        id: `goal-${Date.now()}`,
        goal: '',
        targetDate: null,
        status: 'not_started',
        notes: null,
      },
    ]);
  };

  const updateGoal = (idx: number, field: string, value: string) => {
    setGoals(goals.map((g, i) => (i === idx ? { ...g, [field]: value } : g)));
  };

  const removeGoal = (idx: number) => {
    setGoals(goals.filter((_, i) => i !== idx));
  };

  const addAction = () => {
    setActions([
      ...actions,
      {
        id: `action-${Date.now()}`,
        action: '',
        assigneeId: null,
        assigneeName: null,
        deadline: null,
        completed: false,
      },
    ]);
  };

  const updateAction = (idx: number, field: string, value: string | boolean) => {
    setActions(
      actions.map((a, i) => {
        if (i !== idx) return a;
        if (field === 'assigneeId') {
          const staff = staffOptions.find((s) => s.id === value);
          return { ...a, assigneeId: value as string, assigneeName: staff?.fullName ?? null };
        }
        return { ...a, [field]: value };
      }),
    );
  };

  const removeAction = (idx: number) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        workloadDiscussion: workloadDiscussion || null,
        wellbeingCheck: wellbeingCheck || null,
        concernsRaised: concernsRaised || null,
        developmentGoals: goals.filter((g) => g.goal.trim()),
        actionsAgreed: actions.filter((a) => a.action.trim()),
      });

      if (!result.success) {
        setError(result.error ?? 'Failed to complete supervision');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const textareaClass =
    'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.1_160)]/25 resize-y';
  const inputClass =
    'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.1_160)]/25';
  const labelClass = 'block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1';
  const sectionClass = 'space-y-3';
  const sectionHeaderClass =
    'text-sm font-semibold text-[oklch(0.22_0.04_160)] border-b border-[oklch(0.92_0.005_160)] pb-2';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Workload Discussion */}
      <div className={sectionClass}>
        <h4 className={sectionHeaderClass}>Workload Discussion</h4>
        <div>
          <label htmlFor="workloadDiscussion" className={labelClass}>
            Discuss current workload, caseload, and any capacity issues
          </label>
          <textarea
            id="workloadDiscussion"
            value={workloadDiscussion}
            onChange={(e) => setWorkloadDiscussion(e.target.value)}
            rows={3}
            className={textareaClass}
            placeholder="How is your current workload? Any concerns about capacity?"
          />
        </div>
      </div>

      {/* Wellbeing Check */}
      <div className={sectionClass}>
        <h4 className={sectionHeaderClass}>Wellbeing Check</h4>
        <div>
          <label htmlFor="wellbeingCheck" className={labelClass}>
            Staff wellbeing, morale, and any support needs
          </label>
          <textarea
            id="wellbeingCheck"
            value={wellbeingCheck}
            onChange={(e) => setWellbeingCheck(e.target.value)}
            rows={3}
            className={textareaClass}
            placeholder="How are you feeling at work? Any support needs?"
          />
        </div>
      </div>

      {/* Development Goals */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h4 className={sectionHeaderClass}>Development Goals</h4>
          <button
            type="button"
            onClick={addGoal}
            className="inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.35_0.06_160)] hover:text-[oklch(0.25_0.06_160)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add goal
          </button>
        </div>
        {goals.length === 0 && (
          <p className="text-xs text-[oklch(0.55_0_0)] italic">
            No development goals added. Click &quot;Add goal&quot; to include one.
          </p>
        )}
        {goals.map((goal, idx) => (
          <div key={goal.id} className="rounded-lg border border-[oklch(0.92_0.005_160)] bg-[oklch(0.985_0.003_160)] p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={goal.goal}
                  onChange={(e) => updateGoal(idx, 'goal', e.target.value)}
                  placeholder="Goal description..."
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeGoal(idx)}
                className="rounded p-1 text-[oklch(0.55_0_0)] hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Remove goal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[oklch(0.55_0_0)]">Target date</label>
                <input
                  type="date"
                  value={goal.targetDate ?? ''}
                  onChange={(e) => updateGoal(idx, 'targetDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-[oklch(0.55_0_0)]">Status</label>
                <select
                  value={goal.status}
                  onChange={(e) => updateGoal(idx, 'status', e.target.value)}
                  className={inputClass}
                >
                  {GOAL_STATUSES.map((s) => (
                    <option key={s} value={s}>{GOAL_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Concerns Raised */}
      <div className={sectionClass}>
        <h4 className={sectionHeaderClass}>Concerns Raised</h4>
        <div>
          <label htmlFor="concernsRaised" className={labelClass}>
            Any concerns, safeguarding issues, or matters requiring escalation
          </label>
          <textarea
            id="concernsRaised"
            value={concernsRaised}
            onChange={(e) => setConcernsRaised(e.target.value)}
            rows={3}
            className={textareaClass}
            placeholder="Any concerns to raise?"
          />
        </div>
      </div>

      {/* Actions Agreed */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h4 className={sectionHeaderClass}>Actions Agreed</h4>
          <button
            type="button"
            onClick={addAction}
            className="inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.35_0.06_160)] hover:text-[oklch(0.25_0.06_160)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add action
          </button>
        </div>
        {actions.length === 0 && (
          <p className="text-xs text-[oklch(0.55_0_0)] italic">
            No actions agreed. Click &quot;Add action&quot; to include one.
          </p>
        )}
        {actions.map((action, idx) => (
          <div key={action.id} className="rounded-lg border border-[oklch(0.92_0.005_160)] bg-[oklch(0.985_0.003_160)] p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={action.action}
                  onChange={(e) => updateAction(idx, 'action', e.target.value)}
                  placeholder="Action description..."
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeAction(idx)}
                className="rounded p-1 text-[oklch(0.55_0_0)] hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Remove action"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[oklch(0.55_0_0)]">Assignee</label>
                <select
                  value={action.assigneeId ?? ''}
                  onChange={(e) => updateAction(idx, 'assigneeId', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select assignee...</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[oklch(0.55_0_0)]">Deadline</label>
                <input
                  type="date"
                  value={action.deadline ?? ''}
                  onChange={(e) => updateAction(idx, 'deadline', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-xs text-[oklch(0.45_0_0)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={action.completed}
                    onChange={(e) => updateAction(idx, 'completed', e.target.checked)}
                    className="rounded border-[oklch(0.75_0_0)] text-[oklch(0.35_0.06_160)] focus:ring-[oklch(0.55_0.1_160)]"
                  />
                  Completed
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-[oklch(0.92_0.005_160)]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.45_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[oklch(0.35_0.06_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Complete supervision'}
        </button>
      </div>
    </form>
  );
}
