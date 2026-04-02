'use client';

/**
 * Wound assessment form — captures measurements, wound bed, exudate,
 * surrounding skin, infection signs, pain level, and treatment. VAL-CLIN-012/013.
 */
import { useState } from 'react';
import {
  WOUND_BED_LABELS,
  EXUDATE_LABELS,
  SURROUNDING_SKIN_LABELS,
  PRESSURE_ULCER_GRADE_LABELS,
} from '../schema';

interface WoundAssessmentFormProps {
  woundId: string;
  isPressureUlcer: boolean;
  onSubmit: (data: {
    woundId: string;
    assessmentDate: string;
    lengthCm: number | null;
    widthCm: number | null;
    depthCm: number | null;
    pressureUlcerGrade: string | null;
    woundBed: string | null;
    exudate: string | null;
    surroundingSkin: string | null;
    signsOfInfection: boolean;
    painLevel: number | null;
    treatmentApplied: string;
    notes: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function WoundAssessmentForm({
  woundId,
  isPressureUlcer,
  onSubmit,
  isSubmitting = false,
}: WoundAssessmentFormProps) {
  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [depthCm, setDepthCm] = useState('');
  const [pressureUlcerGrade, setPressureUlcerGrade] = useState('');
  const [woundBed, setWoundBed] = useState('');
  const [exudate, setExudate] = useState('');
  const [surroundingSkin, setSurroundingSkin] = useState('');
  const [signsOfInfection, setSignsOfInfection] = useState(false);
  const [painLevel, setPainLevel] = useState('');
  const [treatmentApplied, setTreatmentApplied] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      woundId,
      assessmentDate,
      lengthCm: lengthCm ? parseFloat(lengthCm) : null,
      widthCm: widthCm ? parseFloat(widthCm) : null,
      depthCm: depthCm ? parseFloat(depthCm) : null,
      pressureUlcerGrade: pressureUlcerGrade || null,
      woundBed: woundBed || null,
      exudate: exudate || null,
      surroundingSkin: surroundingSkin || null,
      signsOfInfection,
      painLevel: painLevel ? parseInt(painLevel, 10) : null,
      treatmentApplied,
      notes,
    });
  };

  const selectClass =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const inputClass = selectClass;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date */}
      <div>
        <label htmlFor="assessmentDate" className="block text-sm font-medium text-gray-700">
          Assessment Date
        </label>
        <input
          id="assessmentDate"
          type="date"
          value={assessmentDate}
          onChange={(e) => setAssessmentDate(e.target.value)}
          required
          className={inputClass}
          style={{ maxWidth: '14rem' }}
        />
      </div>

      {/* Measurements */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-900">Wound Measurements (cm)</legend>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="lengthCm" className="block text-xs text-gray-500">Length</label>
            <input
              id="lengthCm"
              type="number"
              step="0.1"
              min="0"
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              placeholder="cm"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="widthCm" className="block text-xs text-gray-500">Width</label>
            <input
              id="widthCm"
              type="number"
              step="0.1"
              min="0"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              placeholder="cm"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="depthCm" className="block text-xs text-gray-500">Depth</label>
            <input
              id="depthCm"
              type="number"
              step="0.1"
              min="0"
              value={depthCm}
              onChange={(e) => setDepthCm(e.target.value)}
              placeholder="cm"
              className={inputClass}
            />
          </div>
        </div>
        {lengthCm && widthCm && (
          <p className="mt-1 text-xs text-gray-500">
            Area: {(parseFloat(lengthCm) * parseFloat(widthCm)).toFixed(1)} cm2
          </p>
        )}
      </fieldset>

      {/* Pressure Ulcer Grade (conditional) */}
      {isPressureUlcer && (
        <div>
          <label htmlFor="pressureUlcerGrade" className="block text-sm font-medium text-gray-700">
            Pressure Ulcer Grade
          </label>
          <select
            id="pressureUlcerGrade"
            value={pressureUlcerGrade}
            onChange={(e) => setPressureUlcerGrade(e.target.value)}
            className={selectClass}
          >
            <option value="">Select grade...</option>
            {Object.entries(PRESSURE_ULCER_GRADE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Wound Bed */}
      <div>
        <label htmlFor="woundBed" className="block text-sm font-medium text-gray-700">
          Wound Bed
        </label>
        <select
          id="woundBed"
          value={woundBed}
          onChange={(e) => setWoundBed(e.target.value)}
          className={selectClass}
        >
          <option value="">Select...</option>
          {Object.entries(WOUND_BED_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Exudate */}
      <div>
        <label htmlFor="exudate" className="block text-sm font-medium text-gray-700">
          Exudate
        </label>
        <select
          id="exudate"
          value={exudate}
          onChange={(e) => setExudate(e.target.value)}
          className={selectClass}
        >
          <option value="">Select...</option>
          {Object.entries(EXUDATE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Surrounding Skin */}
      <div>
        <label htmlFor="surroundingSkin" className="block text-sm font-medium text-gray-700">
          Surrounding Skin
        </label>
        <select
          id="surroundingSkin"
          value={surroundingSkin}
          onChange={(e) => setSurroundingSkin(e.target.value)}
          className={selectClass}
        >
          <option value="">Select...</option>
          {Object.entries(SURROUNDING_SKIN_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Signs of Infection */}
      <div className="flex items-center gap-3">
        <input
          id="signsOfInfection"
          type="checkbox"
          checked={signsOfInfection}
          onChange={(e) => setSignsOfInfection(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        <label htmlFor="signsOfInfection" className="text-sm font-medium text-gray-700">
          Signs of infection present
        </label>
        {signsOfInfection && (
          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200 ring-inset">
            Infection Alert
          </span>
        )}
      </div>

      {/* Pain Level */}
      <div>
        <label htmlFor="painLevel" className="block text-sm font-medium text-gray-700">
          Pain Level (0-10)
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="painLevel"
            type="range"
            min="0"
            max="10"
            value={painLevel || '0'}
            onChange={(e) => setPainLevel(e.target.value)}
            className="w-48"
          />
          <span className="w-8 text-center text-sm font-medium tabular-nums">
            {painLevel || '0'}
          </span>
        </div>
      </div>

      {/* Treatment Applied */}
      <div>
        <label htmlFor="treatmentApplied" className="block text-sm font-medium text-gray-700">
          Treatment Applied
        </label>
        <textarea
          id="treatmentApplied"
          rows={2}
          value={treatmentApplied}
          onChange={(e) => setTreatmentApplied(e.target.value)}
          placeholder="Describe dressing and treatment applied..."
          className={inputClass}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="assessmentNotes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="assessmentNotes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional observations..."
          className={inputClass}
        />
      </div>

      {/* Photo placeholder */}
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <p className="text-sm text-gray-500">
          Photo documentation placeholder — file upload integration pending
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Assessment'}
      </button>
    </form>
  );
}
