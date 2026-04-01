'use client';

/**
 * StatementOfPurpose — Version-controlled document editor for the
 * Statement of Purpose (Regulation 16, Schedule 1).
 */

import { useState } from 'react';
import type { StatementOfPurposeDoc } from '@/lib/db/schema/ofsted';
import type { StatementOfPurposeSection } from '@/lib/db/schema/ofsted';
import { SOP_STATUS_LABELS } from '@/features/ofsted/constants';
import type { SopStatus } from '@/features/ofsted/constants';
import { updateStatement } from '@/features/ofsted/actions';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SopStatusBadge({ status }: { status: SopStatus }) {
  const colours: Record<SopStatus, string> = {
    draft: 'text-amber-700 bg-amber-50 border-amber-200',
    current: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    archived: 'text-gray-700 bg-gray-50 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colours[status]}`}
    >
      {SOP_STATUS_LABELS[status]}
    </span>
  );
}

function SectionEditor({
  section,
  onChange,
  readOnly,
}: {
  section: StatementOfPurposeSection;
  onChange: (content: string) => void;
  readOnly: boolean;
}) {
  return (
    <div className="rounded-lg border border-[oklch(0.90_0.003_160)] bg-white p-4">
      <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
        {section.order}. {section.title}
      </h4>
      {readOnly ? (
        <div className="mt-2 text-sm text-[oklch(0.35_0_0)] whitespace-pre-wrap">
          {section.content || (
            <span className="italic text-[oklch(0.55_0_0)]">No content yet</span>
          )}
        </div>
      ) : (
        <textarea
          value={section.content}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-3 py-2 text-sm resize-y"
          placeholder={`Enter content for ${section.title}...`}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface StatementOfPurposeProps {
  statement: StatementOfPurposeDoc | null;
  canManage: boolean;
}

export function StatementOfPurpose({
  statement,
  canManage,
}: StatementOfPurposeProps) {
  const [editing, setEditing] = useState(false);
  const [sections, setSections] = useState<StatementOfPurposeSection[]>(
    (statement?.content as StatementOfPurposeSection[]) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!statement) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.85_0.003_160)] p-8 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No Statement of Purpose has been created yet.
        </p>
      </div>
    );
  }

  const status = statement.status as SopStatus;
  const readOnly = !editing || !canManage;

  function updateSection(index: number, content: string) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, content } : s)),
    );
  }

  async function handleSave() {
    if (!statement) return;
    setSaving(true);
    setError(null);

    const result = await updateStatement(statement.id, {
      content: sections,
    });

    if (!result.success) {
      setError(result.error);
    } else {
      setEditing(false);
    }
    setSaving(false);
  }

  async function handlePublish() {
    if (!statement) return;
    setSaving(true);
    setError(null);

    const result = await updateStatement(statement.id, {
      content: sections,
      status: 'current',
    });

    if (!result.success) {
      setError(result.error);
    } else {
      setEditing(false);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[oklch(0.18_0.02_160)]">
            Statement of Purpose
          </h3>
          <SopStatusBadge status={status} />
          <span className="text-xs text-[oklch(0.55_0_0)]">
            Version {statement.version}
          </span>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setSections(
                      (statement.content as StatementOfPurposeSection[]) ?? [],
                    );
                  }}
                  className="rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0_0)] hover:bg-[oklch(0.97_0.003_160)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[oklch(0.45_0.15_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.40_0.15_160)] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                {status === 'draft' && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={saving}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Publish
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg bg-[oklch(0.45_0.15_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.40_0.15_160)]"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            onChange={(content) => updateSection(index, content)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {statement.approvedAt && (
        <p className="text-xs text-[oklch(0.55_0_0)]">
          Published on{' '}
          {new Date(statement.approvedAt).toLocaleDateString('en-GB')}
        </p>
      )}
    </div>
  );
}
