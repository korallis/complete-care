'use client';

/**
 * VisitTypeForm — configure a visit type with task list builder.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  VISIT_TYPE_PRESETS,
  VISIT_TYPE_LABELS,
  VISIT_TYPE_DEFAULTS,
  VISIT_FREQUENCY_LABELS,
  VISIT_FREQUENCIES,
} from '@/features/care-packages/constants';
import type { CreateVisitTypeInput } from '@/features/care-packages/schema';
import type { VisitTask } from '@/lib/db/schema/care-packages';

type VisitTypeFormProps = {
  carePackageId: string;
  onSubmit: (data: CreateVisitTypeInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
};

export function VisitTypeForm({ carePackageId, onSubmit, onCancel }: VisitTypeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('morning');
  const [customName, setCustomName] = useState('');
  const [duration, setDuration] = useState(30);
  const [timeWindowStart, setTimeWindowStart] = useState('07:00');
  const [timeWindowEnd, setTimeWindowEnd] = useState('10:00');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [tasks, setTasks] = useState<VisitTask[]>([]);
  const [newTaskDesc, setNewTaskDesc] = useState('');

  function handlePresetChange(preset: string) {
    setName(preset);
    const defaults = VISIT_TYPE_DEFAULTS[preset as keyof typeof VISIT_TYPE_DEFAULTS];
    if (defaults) {
      setTimeWindowStart(defaults.start);
      setTimeWindowEnd(defaults.end);
      setDuration(defaults.duration);
    }
  }

  function addTask() {
    if (!newTaskDesc.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `task-${Date.now()}`,
        description: newTaskDesc.trim(),
        required: true,
        order: prev.length,
      },
    ]);
    setNewTaskDesc('');
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await onSubmit({
        carePackageId,
        name: name === 'custom' ? customName || 'Custom visit' : name,
        duration,
        timeWindowStart,
        timeWindowEnd,
        taskList: tasks,
        frequency,
      });
      if (result.success) {
        toast.success('Visit type created');
      } else {
        toast.error(result.error ?? 'Failed to create visit type');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Visit type form">
      {/* Visit type preset */}
      <div>
        <label htmlFor="vt-name" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
          Visit type
        </label>
        <select
          id="vt-name"
          value={name}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
        >
          {VISIT_TYPE_PRESETS.map((p) => (
            <option key={p} value={p}>
              {VISIT_TYPE_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {name === 'custom' && (
        <div>
          <label htmlFor="vt-custom-name" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Custom name
          </label>
          <input
            id="vt-custom-name"
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g., Medication round"
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
          />
        </div>
      )}

      {/* Time window + duration */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="vt-start" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Window start
          </label>
          <input
            id="vt-start"
            type="time"
            value={timeWindowStart}
            onChange={(e) => setTimeWindowStart(e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
          />
        </div>
        <div>
          <label htmlFor="vt-end" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Window end
          </label>
          <input
            id="vt-end"
            type="time"
            value={timeWindowEnd}
            onChange={(e) => setTimeWindowEnd(e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
          />
        </div>
        <div>
          <label htmlFor="vt-duration" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Duration (mins)
          </label>
          <input
            id="vt-duration"
            type="number"
            min={5}
            max={480}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
          />
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label htmlFor="vt-freq" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
          Frequency
        </label>
        <select
          id="vt-freq"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekdays' | 'custom')}
          className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
        >
          {VISIT_FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {VISIT_FREQUENCY_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      {/* Task list builder */}
      <div>
        <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
          Task list
        </label>
        {tasks.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[oklch(0.91_0.005_160)] bg-[oklch(0.985_0.003_160)] px-3 py-2"
              >
                <span className="text-sm text-[oklch(0.22_0.04_160)]">
                  {task.description}
                </span>
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="flex-shrink-0 rounded-md p-1 text-[oklch(0.65_0_0)] hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label={`Remove task: ${task.description}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
            placeholder="Add a task..."
            className="flex-1 rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            aria-label="New task description"
          />
          <button
            type="button"
            onClick={addTask}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors"
          aria-busy={isPending}
        >
          {isPending ? 'Creating...' : 'Create visit type'}
        </button>
      </div>
    </form>
  );
}
