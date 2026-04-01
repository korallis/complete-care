'use client';

/**
 * EvidenceLinkForm — Dialog/form for linking a system record as evidence
 * against an Ofsted sub-requirement.
 */

import { useState } from 'react';
import { createEvidence, updateEvidence } from '@/features/ofsted/actions';
import {
  EVIDENCE_TYPES,
  EVIDENCE_TYPE_LABELS,
  EVIDENCE_STATUSES,
  EVIDENCE_STATUS_LABELS,
} from '@/features/ofsted/constants';
import type { EvidenceTypeValue, EvidenceStatus } from '@/features/ofsted/constants';

interface EvidenceLinkFormProps {
  standardId: string;
  subRequirementId: string;
  /** Existing evidence ID if editing */
  existingId?: string;
  existingValues?: {
    evidenceType: string;
    evidenceId: string | null;
    description: string | null;
    status: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function EvidenceLinkForm({
  standardId,
  subRequirementId,
  existingId,
  existingValues,
  onClose,
  onSuccess,
}: EvidenceLinkFormProps) {
  const [evidenceType, setEvidenceType] = useState<EvidenceTypeValue>(
    (existingValues?.evidenceType as EvidenceTypeValue) ?? 'document',
  );
  const [evidenceId, setEvidenceId] = useState(
    existingValues?.evidenceId ?? '',
  );
  const [description, setDescription] = useState(
    existingValues?.description ?? '',
  );
  const [status, setStatus] = useState<EvidenceStatus>(
    (existingValues?.status as EvidenceStatus) ?? 'evidenced',
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (existingId) {
        const result = await updateEvidence(existingId, {
          evidenceType,
          evidenceId: evidenceId || null,
          description: description || null,
          status,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createEvidence({
          standardId,
          subRequirementId,
          evidenceType,
          evidenceId: evidenceId || null,
          description: description || null,
          status,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[oklch(0.18_0.02_160)]">
          {existingId ? 'Edit Evidence' : 'Link Evidence'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Evidence type */}
          <div>
            <label className="block text-sm font-medium text-[oklch(0.35_0_0)]">
              Evidence Type
            </label>
            <select
              value={evidenceType}
              onChange={(e) =>
                setEvidenceType(e.target.value as EvidenceTypeValue)
              }
              className="mt-1 w-full rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-3 py-2 text-sm"
            >
              {EVIDENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EVIDENCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Evidence ID (optional — for linking specific records) */}
          {evidenceType !== 'manual' && (
            <div>
              <label className="block text-sm font-medium text-[oklch(0.35_0_0)]">
                Record ID (optional)
              </label>
              <input
                type="text"
                value={evidenceId}
                onChange={(e) => setEvidenceId(e.target.value)}
                placeholder="Paste the record UUID"
                className="mt-1 w-full rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-[oklch(0.55_0_0)]">
                Link to a specific care plan, note, incident, or document
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[oklch(0.35_0_0)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Describe the evidence..."
              className="mt-1 w-full rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[oklch(0.35_0_0)]">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EvidenceStatus)}
              className="mt-1 w-full rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-3 py-2 text-sm"
            >
              {EVIDENCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {EVIDENCE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[oklch(0.45_0.15_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.40_0.15_160)] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : existingId ? 'Update' : 'Link Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
