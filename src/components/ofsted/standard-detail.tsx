'use client';

/**
 * StandardDetail — Shows a single Quality Standard with its sub-requirements
 * and linked evidence. Allows managers to add/edit evidence.
 */

import type { OfstedStandard } from '@/lib/db/schema/ofsted';
import type { QualityStandardTemplate, SubRequirement } from '@/features/ofsted/standards';
import {
  EVIDENCE_STATUS_LABELS,
  EVIDENCE_STATUS_COLOURS,
  EVIDENCE_TYPE_LABELS,
  scoreToRag,
  computeComplianceScore,
} from '@/features/ofsted/constants';
import type { EvidenceStatus, EvidenceTypeValue } from '@/features/ofsted/constants';
import type { OfstedEvidenceWithReviewer } from '@/features/ofsted/actions';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: EvidenceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${EVIDENCE_STATUS_COLOURS[status]}`}
    >
      {EVIDENCE_STATUS_LABELS[status]}
    </span>
  );
}

function SubRequirementRow({
  subReq,
  evidence,
  canManage,
  onAddEvidence,
}: {
  subReq: SubRequirement;
  evidence: OfstedEvidenceWithReviewer | undefined;
  canManage: boolean;
  onAddEvidence: (subReqId: string) => void;
}) {
  const status: EvidenceStatus = evidence?.status as EvidenceStatus ?? 'missing';

  return (
    <div className="flex items-start gap-4 rounded-lg border border-[oklch(0.90_0.003_160)] bg-white p-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
          {subReq.text}
        </p>
        {evidence && (
          <div className="mt-2 space-y-1">
            {evidence.description && (
              <p className="text-xs text-[oklch(0.55_0_0)]">
                {evidence.description}
              </p>
            )}
            <p className="text-xs text-[oklch(0.55_0_0)]">
              Evidence type:{' '}
              {EVIDENCE_TYPE_LABELS[evidence.evidenceType as EvidenceTypeValue] ??
                evidence.evidenceType}
            </p>
            <p className="text-xs text-[oklch(0.55_0_0)]">
              Reviewed{' '}
              {evidence.reviewedAt
                ? new Date(evidence.reviewedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'date not recorded'}
              {' '}by{' '}
              <span className="font-medium text-[oklch(0.35_0.04_160)]">
                {evidence.reviewedByName ?? 'Unknown reviewer'}
              </span>
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={status} />
        {canManage && (
          <button
            type="button"
            onClick={() => onAddEvidence(subReq.id)}
            className="text-xs font-medium text-[oklch(0.45_0.15_160)] hover:text-[oklch(0.35_0.15_160)] transition-colors"
          >
            {evidence ? 'Edit' : 'Add Evidence'}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface StandardDetailProps {
  standard: OfstedStandard;
  template: QualityStandardTemplate;
  evidence: OfstedEvidenceWithReviewer[];
  canManage: boolean;
  onAddEvidence: (subRequirementId: string) => void;
}

export function StandardDetail({
  standard,
  template,
  evidence,
  canManage,
  onAddEvidence,
}: StandardDetailProps) {
  const evidenceMap = new Map(
    evidence.map((e) => [e.subRequirementId, e]),
  );

  const evidenced = evidence.filter((e) => e.status === 'evidenced').length;
  const partial = evidence.filter((e) => e.status === 'partial').length;
  const unevidenced = template.subRequirements.filter(
    (sr) => !evidenceMap.has(sr.id),
  ).length;
  const missing =
    evidence.filter((e) => e.status === 'missing').length + unevidenced;
  const score = computeComplianceScore({ evidenced, partial, missing });
  const rag = scoreToRag(score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wider">
          Regulation {standard.regulationNumber}
        </p>
        <h2 className="text-xl font-semibold text-[oklch(0.18_0.02_160)] mt-1">
          {standard.standardName}
        </h2>
        {standard.description && (
          <p className="text-sm text-[oklch(0.45_0_0)] mt-2 max-w-3xl">
            {standard.description}
          </p>
        )}
      </div>

      {/* Score summary */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
            {score}%
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
              rag === 'green'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : rag === 'amber'
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-red-700 bg-red-50 border-red-200'
            }`}
          >
            {evidenced + partial}/{template.subRequirements.length} sub-requirements
          </span>
        </div>
      </div>

      {/* Sub-requirements */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[oklch(0.35_0_0)]">
          Sub-Requirements ({template.subRequirements.length})
        </h3>
        {template.subRequirements.map((subReq) => (
          <SubRequirementRow
            key={subReq.id}
            subReq={subReq}
            evidence={evidenceMap.get(subReq.id)}
            canManage={canManage}
            onAddEvidence={onAddEvidence}
          />
        ))}
      </div>
    </div>
  );
}
