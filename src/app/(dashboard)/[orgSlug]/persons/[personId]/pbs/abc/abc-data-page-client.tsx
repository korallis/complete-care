'use client';

import { useState } from 'react';
import { AbcIncidentForm, AbcPatternAnalysis } from '@/features/pbs/components';
import type { CreateAbcIncidentInput } from '@/features/pbs/schema';
import type { AbcIncident } from '@/lib/db/schema/pbs';

interface Props {
  personId: string;
}

export function AbcDataPageClient({ personId }: Props) {
  const [showForm, setShowForm] = useState(false);
  // In production, incidents would come from a server action / RSC fetch.
  // This local state demonstrates the flow.
  const [incidents, setIncidents] = useState<AbcIncident[]>([]);

  async function handleSubmit(data: CreateAbcIncidentInput) {
    // In production this calls createAbcIncident server action.
    // We simulate adding it to local state for demonstration.
    const newIncident: AbcIncident = {
      id: crypto.randomUUID(),
      organisationId: '',
      personId: data.personId,
      pbsPlanId: data.pbsPlanId ?? null,
      occurredAt: new Date(data.occurredAt),
      antecedentCategory: data.antecedentCategory,
      antecedentDescription: data.antecedentDescription,
      behaviourTopography: data.behaviourTopography,
      behaviourDuration: data.behaviourDuration ?? null,
      behaviourIntensity: data.behaviourIntensity,
      consequenceStaffResponse: data.consequenceStaffResponse,
      settingEnvironment: data.settingEnvironment ?? null,
      settingPeoplePresent: data.settingPeoplePresent ?? null,
      settingActivity: data.settingActivity ?? null,
      settingSensoryFactors: data.settingSensoryFactors ?? null,
      recordedBy: null,
      createdAt: new Date(),
    };
    setIncidents((prev) => [newIncident, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="space-y-8">
      {/* Record button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Record Incident'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <AbcIncidentForm
          personId={personId}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Incident list */}
      {incidents.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              Recorded Incidents ({incidents.length})
            </h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {incidents.map((inc) => (
              <li key={inc.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(inc.occurredAt).toLocaleString('en-GB')}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {inc.antecedentCategory} — Intensity {inc.behaviourIntensity}/5
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                    {inc.antecedentCategory}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700 line-clamp-2">
                  {inc.behaviourTopography}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pattern Analysis */}
      <div>
        <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-900">
          Pattern Analysis
        </h2>
        <AbcPatternAnalysis incidents={incidents} />
      </div>
    </div>
  );
}
