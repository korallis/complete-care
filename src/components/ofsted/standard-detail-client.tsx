'use client';

import { useMemo, useState } from 'react';
import { EvidenceLinkForm } from '@/components/ofsted/evidence-link-form';
import { StandardDetail } from '@/components/ofsted/standard-detail';
import type { OfstedEvidenceWithReviewer } from '@/features/ofsted/actions';
import type { QualityStandardTemplate } from '@/features/ofsted/standards';
import type { OfstedStandard } from '@/lib/db/schema/ofsted';

interface StandardDetailClientProps {
  standard: OfstedStandard;
  template: QualityStandardTemplate;
  initialEvidence: OfstedEvidenceWithReviewer[];
  canManage: boolean;
}

export function StandardDetailClient({
  standard,
  template,
  initialEvidence,
  canManage,
}: StandardDetailClientProps) {
  const [evidence, setEvidence] = useState<OfstedEvidenceWithReviewer[]>(initialEvidence);
  const [editingSubRequirementId, setEditingSubRequirementId] = useState<
    string | null
  >(null);

  const selectedEvidence = useMemo(
    () =>
      editingSubRequirementId
        ? evidence.find(
            (row) => row.subRequirementId === editingSubRequirementId,
          ) ?? null
        : null,
    [editingSubRequirementId, evidence],
  );

  return (
    <>
      <StandardDetail
        standard={standard}
        template={template}
        evidence={evidence}
        canManage={canManage}
        onAddEvidence={setEditingSubRequirementId}
      />

      {editingSubRequirementId && (
        <EvidenceLinkForm
          standardId={standard.id}
          subRequirementId={editingSubRequirementId}
          existingId={selectedEvidence?.id}
          existingValues={
            selectedEvidence
              ? {
                  evidenceType: selectedEvidence.evidenceType,
                  evidenceId: selectedEvidence.evidenceId,
                  description: selectedEvidence.description,
                  status: selectedEvidence.status,
                }
              : undefined
          }
          onClose={() => setEditingSubRequirementId(null)}
          onSuccess={async () => {
            setEditingSubRequirementId(null);
            const { listEvidenceForStandard } = await import(
              '@/features/ofsted/actions'
            );
            const refreshedEvidence = await listEvidenceForStandard(standard.id);
            setEvidence(refreshedEvidence);
          }}
        />
      )}
    </>
  );
}
