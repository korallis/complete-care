'use client';

/**
 * CarePlanDetail — full care plan view with sections, approval workflow,
 * and version controls.
 */

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CarePlanStatusBadge, ReviewStatusBadge } from './care-plan-status-badge';
import { CarePlanOfstedLinker } from './care-plan-ofsted-linker';
import type { CarePlan, CarePlanSection } from '@/lib/db/schema/care-plans';
import { REVIEW_FREQUENCY_LABELS } from '@/features/care-plans/utils';

// ---------------------------------------------------------------------------
// Section display
// ---------------------------------------------------------------------------

function SectionDisplay({ section }: { section: CarePlanSection }) {
  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-[oklch(0.95_0.003_160)] bg-[oklch(0.985_0.003_160)]">
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">{section.title}</h3>
      </div>
      <div className="p-5">
        {section.content ? (
          <div className="whitespace-pre-wrap text-sm text-[oklch(0.22_0.04_160)] leading-relaxed">
            {section.content}
          </div>
        ) : (
          <p className="text-sm text-[oklch(0.65_0_0)] italic">No content recorded for this section.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approval workflow panel
// ---------------------------------------------------------------------------

type WorkflowPanelProps = {
  carePlan: CarePlan;
  canEdit: boolean;
  canApprove: boolean;
  orgSlug: string;
  personId: string;
  onSubmitForReview: () => Promise<{ success: boolean; error?: string }>;
  onApprove: () => Promise<{ success: boolean; error?: string }>;
  onReturnToDraft: () => Promise<{ success: boolean; error?: string }>;
};

function WorkflowPanel({
  carePlan,
  canEdit,
  canApprove,
  orgSlug,
  personId,
  onSubmitForReview,
  onApprove,
  onReturnToDraft,
}: WorkflowPanelProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const steps = [
    { id: 'draft', label: 'Draft' },
    { id: 'review', label: 'In Review' },
    { id: 'approved', label: 'Approved' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === carePlan.status);

  function handleAction(
    action: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Action failed');
      }
    });
  }

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
        Approval workflow
      </h3>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-5">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < currentStepIndex
                    ? 'bg-[oklch(0.3_0.08_160)] text-white'
                    : i === currentStepIndex
                    ? 'bg-[oklch(0.3_0.08_160)] text-white ring-2 ring-[oklch(0.3_0.08_160)/0.3] ring-offset-1'
                    : 'bg-[oklch(0.93_0.003_160)] text-[oklch(0.55_0_0)]'
                }`}
                aria-current={i === currentStepIndex ? 'step' : undefined}
              >
                {i < currentStepIndex ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs font-medium ${i === currentStepIndex ? 'text-[oklch(0.22_0.04_160)]' : 'text-[oklch(0.6_0_0)]'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 min-w-4 ${i < currentStepIndex ? 'bg-[oklch(0.3_0.08_160)]' : 'bg-[oklch(0.88_0_0)]'}`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      {carePlan.status !== 'archived' && (
        <div className="flex flex-wrap gap-2">
          {carePlan.status === 'draft' && canEdit && (
            <>
              <Link
                href={`/${orgSlug}/persons/${personId}/care-plans/${carePlan.id}/edit`}
                className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
              >
                Edit plan
              </Link>
              <button
                type="button"
                onClick={() => handleAction(onSubmitForReview, 'Care plan submitted for review')}
                disabled={isPending}
                className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              >
                Submit for review
              </button>
            </>
          )}

          {carePlan.status === 'review' && (
            <>
              {canApprove && (
                <button
                  type="button"
                  onClick={() => handleAction(onApprove, 'Care plan approved')}
                  disabled={isPending}
                  className="rounded-lg bg-[oklch(0.3_0.08_160)] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
                >
                  Approve care plan
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleAction(onReturnToDraft, 'Care plan returned to draft')}
                  disabled={isPending}
                  className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
                >
                  Return to draft
                </button>
              )}
            </>
          )}

          {carePlan.status === 'approved' && canEdit && (
            <Link
              href={`/${orgSlug}/persons/${personId}/care-plans/${carePlan.id}/edit`}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              Edit & create new version
            </Link>
          )}
        </div>
      )}

      {/* Approval info */}
      {carePlan.approvedAt && carePlan.authorisedBy && (
        <div className="mt-4 pt-4 border-t border-[oklch(0.95_0.003_160)] text-xs text-[oklch(0.55_0_0)]">
          Approved by <span className="font-medium text-[oklch(0.35_0.04_160)]">{carePlan.authorisedBy}</span>{' '}
          on{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {new Date(carePlan.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type CarePlanDetailProps = {
  carePlan: CarePlan;
  orgSlug: string;
  personId: string;
  personName: string;
  canEdit: boolean;
  canApprove: boolean;
  canManageOfsted: boolean;
  qualityStandards: Array<{ id: string; name: string; regulationNumber: number }>;
  linkedStandards: Array<{ standardId: string; standardName: string; regulationNumber: number }>;
  onSubmitForReview: () => Promise<{ success: boolean; error?: string }>;
  onApprove: () => Promise<{ success: boolean; error?: string }>;
  onReturnToDraft: () => Promise<{ success: boolean; error?: string }>;
  onSaveLinkedStandards: (standardIds: string[]) => Promise<{ success: boolean; error?: string }>;
};

export function CarePlanDetail({
  carePlan,
  orgSlug,
  personId,
  personName,
  canEdit,
  canApprove,
  canManageOfsted,
  qualityStandards,
  linkedStandards,
  onSubmitForReview,
  onApprove,
  onReturnToDraft,
  onSaveLinkedStandards,
}: CarePlanDetailProps) {
  const sections = (carePlan.sections ?? []) as CarePlanSection[];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)] truncate">
                {carePlan.title}
              </h1>
              <span className="text-sm font-mono text-[oklch(0.65_0_0)]">
                v{carePlan.version}
              </span>
            </div>
            <p className="text-sm text-[oklch(0.55_0_0)] mb-3">
              Care plan for <span className="font-medium text-[oklch(0.35_0.04_160)]">{personName}</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <CarePlanStatusBadge status={carePlan.status} />
              <ReviewStatusBadge nextReviewDate={carePlan.nextReviewDate} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <Link
              href={`/${orgSlug}/persons/${personId}/care-plans/${carePlan.id}/history`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Version history
            </Link>
            <Link
              href={`/${orgSlug}/persons/${personId}/care-plans/${carePlan.id}/print`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
              aria-label="Export care plan as PDF"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </Link>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 pt-4 border-t border-[oklch(0.95_0.003_160)] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Review frequency</dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {REVIEW_FREQUENCY_LABELS[carePlan.reviewFrequency ?? ''] ?? 'Not set'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Next review</dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {carePlan.nextReviewDate
                ? new Date(carePlan.nextReviewDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Not scheduled'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Created</dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {new Date(carePlan.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Last updated</dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {new Date(carePlan.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        </div>
      </div>

      {/* Workflow panel */}
      <WorkflowPanel
        carePlan={carePlan}
        canEdit={canEdit}
        canApprove={canApprove}
        orgSlug={orgSlug}
        personId={personId}
        onSubmitForReview={onSubmitForReview}
        onApprove={onApprove}
        onReturnToDraft={onReturnToDraft}
      />

      {(canManageOfsted || linkedStandards.length > 0) && (
        <CarePlanOfstedLinker
          canManage={canManageOfsted}
          standards={qualityStandards}
          linkedStandards={linkedStandards}
          onSave={onSaveLinkedStandards}
        />
      )}

      {/* Sections */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
          Care plan sections
          <span className="ml-2 text-xs font-normal normal-case text-[oklch(0.65_0_0)]">
            ({sections.length} section{sections.length !== 1 ? 's' : ''})
          </span>
        </h2>

        {sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
            <p className="text-sm text-[oklch(0.55_0_0)]">
              This care plan has no sections yet.
              {canEdit && (
                <>
                  {' '}
                  <Link
                    href={`/${orgSlug}/persons/${personId}/care-plans/${carePlan.id}/edit`}
                    className="text-[oklch(0.35_0.06_160)] underline hover:no-underline"
                  >
                    Edit the plan
                  </Link>{' '}
                  to add sections.
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...sections]
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SectionDisplay key={section.id} section={section} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
