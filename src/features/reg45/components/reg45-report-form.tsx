'use client';

import { useState } from 'react';

const SECTIONS = [
  {
    field: 'reg44FindingsSummary',
    label: 'Summary of Reg 44 Findings',
    description: 'Summarise key findings from monthly Reg 44 visits in this period.',
  },
  {
    field: 'actionsTaken',
    label: 'Actions Taken',
    description: 'Detail actions taken in response to Reg 44 findings and other concerns.',
  },
  {
    field: 'qualityOfCareAssessment',
    label: 'Quality of Care Assessment',
    description: 'Overall assessment of the quality of care provided.',
  },
  {
    field: 'staffDevelopment',
    label: 'Staff Development',
    description: 'Staff training, development, and supervision during the period.',
  },
  {
    field: 'childrensProgress',
    label: "Children's Progress",
    description: 'Progress made by children in placement, outcomes, and well-being.',
  },
  {
    field: 'recommendations',
    label: 'Recommendations',
    description: 'Recommendations for the next reporting period.',
  },
] as const;

interface Reg45FormData {
  reportingPeriod: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  reg44FindingsSummary: string;
  actionsTaken: string;
  qualityOfCareAssessment: string;
  staffDevelopment: string;
  childrensProgress: string;
  recommendations: string;
}

export function Reg45ReportForm({
  initialData,
  version,
}: {
  initialData?: Partial<Reg45FormData>;
  version?: number;
}) {
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
      {version && (
        <div className="rounded-md bg-muted px-4 py-2 text-sm">
          Version {version}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="reportingPeriod" className="mb-1 block text-sm font-medium">
            Reporting Period Label
          </label>
          <input
            id="reportingPeriod"
            name="reportingPeriod"
            type="text"
            required
            defaultValue={initialData?.reportingPeriod}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. Oct 2025 - Mar 2026"
          />
        </div>
        <div>
          <label htmlFor="reportingPeriodStart" className="mb-1 block text-sm font-medium">
            Period Start
          </label>
          <input
            id="reportingPeriodStart"
            name="reportingPeriodStart"
            type="date"
            required
            defaultValue={initialData?.reportingPeriodStart}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="reportingPeriodEnd" className="mb-1 block text-sm font-medium">
            Period End
          </label>
          <input
            id="reportingPeriodEnd"
            name="reportingPeriodEnd"
            type="date"
            required
            defaultValue={initialData?.reportingPeriodEnd}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {SECTIONS.map((section) => (
        <fieldset key={section.field} className="rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">{section.label}</legend>
          <p className="mb-2 text-xs text-muted-foreground">{section.description}</p>
          <textarea
            name={section.field}
            rows={5}
            defaultValue={initialData?.[section.field as keyof Reg45FormData] ?? ''}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </fieldset>
      ))}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </form>
  );
}
