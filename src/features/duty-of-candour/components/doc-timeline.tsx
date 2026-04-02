'use client';

import type { DocTimelineStep } from '../types';

function getStepLabel(step: DocTimelineStep['step']): string {
  switch (step) {
    case 'verbal':
      return 'Verbal Notification';
    case 'written':
      return 'Written Follow-up (10 days)';
    case 'investigation':
      return 'Investigation Findings';
    case 'apology':
      return 'Apology';
  }
}

export function DocTimeline({ steps }: { steps: DocTimelineStep[] }) {
  return (
    <div className="space-y-1">
      {steps.map((step, idx) => (
        <div key={step.step} className="flex items-center gap-3">
          {/* Connector line */}
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step.completed
                  ? 'bg-green-500 text-white'
                  : step.overdue
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-6 w-0.5 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{getStepLabel(step.step)}</p>
            {step.date && (
              <p className="text-xs text-muted-foreground">{step.date}</p>
            )}
            {step.overdue && !step.completed && (
              <p className="text-xs font-medium text-red-600">OVERDUE</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
