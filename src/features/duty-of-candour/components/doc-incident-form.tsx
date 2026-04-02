'use client';

import { useState } from 'react';
import type { DocSeverity } from '../types';

const SEVERITY_OPTIONS: { value: DocSeverity; label: string }[] = [
  { value: 'moderate_harm', label: 'Moderate Harm' },
  { value: 'severe_harm', label: 'Severe Harm' },
  { value: 'death', label: 'Death' },
  { value: 'prolonged_psychological_harm', label: 'Prolonged Psychological Harm' },
];

export function DocIncidentForm({ personId }: { personId: string }) {
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        // TODO: Wire to server action
        setSaving(false);
      }}
    >
      <div>
        <label htmlFor="incidentTitle" className="mb-1 block text-sm font-medium">
          Incident Title
        </label>
        <input
          id="incidentTitle"
          name="incidentTitle"
          type="text"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Brief description of the safety incident"
        />
      </div>

      <div>
        <label htmlFor="incidentDescription" className="mb-1 block text-sm font-medium">
          Full Description
        </label>
        <textarea
          id="incidentDescription"
          name="incidentDescription"
          rows={4}
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Detailed description of the notifiable safety incident..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="incidentDate" className="mb-1 block text-sm font-medium">
            Incident Date
          </label>
          <input
            id="incidentDate"
            name="incidentDate"
            type="datetime-local"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="severity" className="mb-1 block text-sm font-medium">
            Severity
          </label>
          <select
            id="severity"
            name="severity"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Select severity...</option>
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline steps */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          CQC Regulation 20 — Duty of Candour Steps
        </legend>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md bg-muted/50 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Verbal Notification</p>
              <p className="text-xs text-muted-foreground">
                Inform the person (or their representative) as soon as reasonably practicable.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-muted/50 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </div>
            <div>
              <p className="text-sm font-medium">Written Follow-up</p>
              <p className="text-xs text-muted-foreground">
                Provide written notification within 10 working days of the incident.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-muted/50 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </div>
            <div>
              <p className="text-sm font-medium">Investigation</p>
              <p className="text-xs text-muted-foreground">
                Conduct a thorough investigation and document findings.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-muted/50 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              4
            </div>
            <div>
              <p className="text-sm font-medium">Apology</p>
              <p className="text-xs text-muted-foreground">
                Provide a sincere apology (this is not an admission of liability).
              </p>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Recording...' : 'Record Incident'}
        </button>
      </div>
    </form>
  );
}
