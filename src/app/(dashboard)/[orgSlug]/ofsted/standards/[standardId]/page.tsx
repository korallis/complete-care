'use client';

/**
 * Standard Detail Page — Shows a single Quality Standard with sub-requirements
 * and evidence. Wraps the StandardDetail component with an EvidenceLinkForm modal.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { EvidenceLinkForm } from '@/components/ofsted/evidence-link-form';
import { listEvidenceForStandard } from '@/features/ofsted/actions';
import type { OfstedEvidence } from '@/lib/db/schema/ofsted';

export default function StandardDetailPage() {
  const params = useParams<{ orgSlug: string; standardId: string }>();
  const { orgSlug, standardId } = params;

  const [evidence, setEvidence] = useState<OfstedEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubReq, setEditingSubReq] = useState<string | null>(null);

  const loadEvidence = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await listEvidenceForStandard(standardId);
      setEvidence(rows);
    } finally {
      setLoading(false);
    }
  }, [standardId]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-[oklch(0.93_0.003_160)] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
        <Link
          href={`/${orgSlug}/ofsted`}
          className="hover:text-[oklch(0.35_0.15_160)]"
        >
          Ofsted Compliance
        </Link>
        <span>/</span>
        <span className="text-[oklch(0.35_0_0)]">Standard Detail</span>
      </nav>

      {/* Evidence list */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[oklch(0.18_0.02_160)]">
          Standard Evidence
        </h2>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          {evidence.length} evidence record(s) linked to this standard.
        </p>

        {/* Display evidence rows */}
        <div className="space-y-3">
          {evidence.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border border-[oklch(0.90_0.003_160)] bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                    {e.subRequirementId}
                  </p>
                  {e.description && (
                    <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
                      {e.description}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    e.status === 'evidenced'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : e.status === 'partial'
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-red-700 bg-red-50 border-red-200'
                  }`}
                >
                  {e.status === 'evidenced'
                    ? 'Fully Evidenced'
                    : e.status === 'partial'
                      ? 'Partially Evidenced'
                      : 'No Evidence'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add evidence button */}
        <button
          type="button"
          onClick={() => setEditingSubReq('new')}
          className="rounded-lg bg-[oklch(0.45_0.15_160)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[oklch(0.40_0.15_160)] transition-colors"
        >
          Link Evidence
        </button>
      </div>

      {/* Evidence link form modal */}
      {editingSubReq && (
        <EvidenceLinkForm
          standardId={standardId}
          subRequirementId={editingSubReq}
          onClose={() => setEditingSubReq(null)}
          onSuccess={() => {
            setEditingSubReq(null);
            loadEvidence();
          }}
        />
      )}
    </div>
  );
}
