'use client';

import { useState } from 'react';
import type { ClientEnvironment } from '@/lib/db/schema/visit-tasks';
import { RISK_LEVEL_CONFIG } from '../constants';

interface ClientEnvironmentFormProps {
  existing?: ClientEnvironment | null;
  onSubmit: (data: {
    clientName: string;
    keySafeCodeEncrypted?: string;
    keySafeLocation?: string;
    accessInstructions?: string;
    riskNotes?: string;
    riskLevel: string;
    parkingInfo?: string;
    environmentNotes?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    mobilityConsiderations?: string;
  }) => void;
  disabled?: boolean;
}

export function ClientEnvironmentForm({
  existing,
  onSubmit,
  disabled = false,
}: ClientEnvironmentFormProps) {
  const [clientName, setClientName] = useState(existing?.clientName ?? '');
  const [keySafeCode, setKeySafeCode] = useState('');
  const [keySafeLocation, setKeySafeLocation] = useState(
    existing?.keySafeLocation ?? '',
  );
  const [accessInstructions, setAccessInstructions] = useState(
    existing?.accessInstructions ?? '',
  );
  const [riskNotes, setRiskNotes] = useState(existing?.riskNotes ?? '');
  const [riskLevel, setRiskLevel] = useState(existing?.riskLevel ?? 'low');
  const [parkingInfo, setParkingInfo] = useState(existing?.parkingInfo ?? '');
  const [environmentNotes, setEnvironmentNotes] = useState(
    existing?.environmentNotes ?? '',
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    existing?.emergencyContactName ?? '',
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    existing?.emergencyContactPhone ?? '',
  );
  const [mobilityConsiderations, setMobilityConsiderations] = useState(
    existing?.mobilityConsiderations ?? '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      clientName,
      keySafeCodeEncrypted: keySafeCode || undefined,
      keySafeLocation: keySafeLocation || undefined,
      accessInstructions: accessInstructions || undefined,
      riskNotes: riskNotes || undefined,
      riskLevel,
      parkingInfo: parkingInfo || undefined,
      environmentNotes: environmentNotes || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      mobilityConsiderations: mobilityConsiderations || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Client name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Client Name *
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            disabled={disabled}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        {/* Risk level */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Risk Level
          </label>
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            disabled={disabled}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          >
            {Object.entries(RISK_LEVEL_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {/* Key safe code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Key Safe Code
          </label>
          <input
            type="password"
            value={keySafeCode}
            onChange={(e) => setKeySafeCode(e.target.value)}
            placeholder={existing?.keySafeCodeEncrypted ? '(encrypted - enter new to update)' : 'Enter code'}
            disabled={disabled}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            autoComplete="off"
          />
          <p className="mt-0.5 text-xs text-gray-400">
            Stored encrypted at rest
          </p>
        </div>

        {/* Key safe location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Key Safe Location
          </label>
          <input
            type="text"
            value={keySafeLocation}
            onChange={(e) => setKeySafeLocation(e.target.value)}
            placeholder="e.g. Left side of front door"
            disabled={disabled}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        {/* Emergency contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Emergency Contact Name
          </label>
          <input
            type="text"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            disabled={disabled}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Emergency Contact Phone
          </label>
          <input
            type="tel"
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            disabled={disabled}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
      </div>

      {/* Full-width fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Access Instructions
          </label>
          <textarea
            value={accessInstructions}
            onChange={(e) => setAccessInstructions(e.target.value)}
            placeholder="Door entry codes, which buzzer, gate codes, etc."
            disabled={disabled}
            rows={2}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Risk Notes
          </label>
          <textarea
            value={riskNotes}
            onChange={(e) => setRiskNotes(e.target.value)}
            placeholder="Hazards, aggressive pets, infection control, neighbourhood concerns..."
            disabled={disabled}
            rows={2}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Parking Information
          </label>
          <textarea
            value={parkingInfo}
            onChange={(e) => setParkingInfo(e.target.value)}
            placeholder="Where to park, permit requirements, bay number..."
            disabled={disabled}
            rows={2}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mobility Considerations
          </label>
          <textarea
            value={mobilityConsiderations}
            onChange={(e) => setMobilityConsiderations(e.target.value)}
            placeholder="Stairs, narrow doorways, equipment needed..."
            disabled={disabled}
            rows={2}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Environment Notes
          </label>
          <textarea
            value={environmentNotes}
            onChange={(e) => setEnvironmentNotes(e.target.value)}
            placeholder="General notes about the property environment..."
            disabled={disabled}
            rows={2}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || !clientName.trim()}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {existing ? 'Update Environment Record' : 'Create Environment Record'}
      </button>
    </form>
  );
}
