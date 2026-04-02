'use client';

/**
 * MCA Assessment Wizard — 3-step guided flow implementing the Mental Capacity Act 2005 two-stage test.
 *
 * Step 1: Diagnostic Test — "Is there an impairment of, or disturbance in, the functioning of the mind or brain?"
 * Step 2: Functional Test — Four criteria (only shown if diagnostic = Yes)
 * Step 3: Best Interest Decision (only shown if outcome = lacks_capacity)
 *
 * Design: Clinical-professional aesthetic with clear step progression,
 * amber/teal status indicators, and prominent outcome badges.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  deriveMcaOutcome,
  type McaOutcome,
  type PersonConsulted,
} from '../types';

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

type StepStatus = 'upcoming' | 'current' | 'complete' | 'skipped';

interface Step {
  number: number;
  label: string;
  status: StepStatus;
}

function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <nav aria-label="Assessment progress" className="mb-8">
      <ol className="flex items-center gap-0">
        {steps.map((step, i) => (
          <li key={step.number} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <span
                className={`
                  flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold
                  transition-all duration-300
                  ${step.status === 'current' ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' : ''}
                  ${step.status === 'complete' ? 'bg-emerald-600 text-white' : ''}
                  ${step.status === 'upcoming' ? 'border-2 border-slate-200 text-slate-400' : ''}
                  ${step.status === 'skipped' ? 'border-2 border-dashed border-slate-300 text-slate-300' : ''}
                `}
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {step.status === 'complete' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === 'skipped' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                ) : (
                  step.number
                )}
              </span>
              <span
                className={`
                  text-sm font-medium whitespace-nowrap
                  ${step.status === 'current' ? 'text-slate-900' : ''}
                  ${step.status === 'complete' ? 'text-emerald-700' : ''}
                  ${step.status === 'upcoming' ? 'text-slate-400' : ''}
                  ${step.status === 'skipped' ? 'text-slate-300 line-through' : ''}
                `}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`
                  mx-4 h-px w-12
                  ${step.status === 'complete' ? 'bg-emerald-300' : 'bg-slate-200'}
                  transition-colors duration-300
                `}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Outcome badge
// ---------------------------------------------------------------------------

function OutcomeBadge({ outcome }: { outcome: McaOutcome | null }) {
  if (!outcome) return null;

  const isCapable = outcome === 'has_capacity';

  return (
    <div
      className={`
        mt-6 flex items-center gap-3 rounded-lg border-2 px-5 py-4
        transition-all duration-500
        ${isCapable
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-amber-200 bg-amber-50 text-amber-800'}
      `}
      role="status"
      aria-live="polite"
    >
      <span className="text-2xl" aria-hidden="true">
        {isCapable ? (
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
      </span>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide">
          Assessment Outcome
        </p>
        <p className="text-lg font-bold">
          {isCapable ? 'Has Capacity' : 'Lacks Capacity'}
        </p>
        {!isCapable && (
          <p className="mt-1 text-sm">
            A best interest decision is now required under s4 MCA 2005.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form field components
// ---------------------------------------------------------------------------

function FormField({
  label,
  htmlFor,
  required,
  children,
  description,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {children}
    </div>
  );
}

function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm
                 text-slate-900 placeholder:text-slate-400
                 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200
                 transition-colors duration-150"
    />
  );
}

function YesNoToggle({
  id,
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
}: {
  id: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-labelledby={id}>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`
          rounded-md border px-4 py-2 text-sm font-medium transition-all duration-150
          ${value === true
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'}
        `}
        aria-pressed={value === true}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`
          rounded-md border px-4 py-2 text-sm font-medium transition-all duration-150
          ${value === false
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'}
        `}
        aria-pressed={value === false}
      >
        {noLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Functional test criterion
// ---------------------------------------------------------------------------

function FunctionalCriterion({
  id,
  question,
  value,
  onValueChange,
  evidence,
  onEvidenceChange,
}: {
  id: string;
  question: string;
  value: boolean | null;
  onValueChange: (v: boolean) => void;
  evidence: string;
  onEvidenceChange: (v: string) => void;
}) {
  return (
    <div
      className={`
        rounded-lg border p-4 transition-all duration-200
        ${value === false ? 'border-amber-200 bg-amber-50/50' : ''}
        ${value === true ? 'border-emerald-200 bg-emerald-50/50' : ''}
        ${value === null ? 'border-slate-200 bg-white' : ''}
      `}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-semibold text-slate-800">{question}</p>
          <YesNoToggle id={id} value={value} onChange={onValueChange} />
        </div>
        <TextArea
          id={`${id}-evidence`}
          value={evidence}
          onChange={onEvidenceChange}
          placeholder="Record evidence supporting this assessment..."
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

export interface McaWizardProps {
  personId: string;
  personName: string;
  assessorId: string;
  onComplete: (data: McaWizardResult) => void;
  onCancel: () => void;
}

export interface McaWizardResult {
  assessment: {
    personId: string;
    decisionToBeAssessed: string;
    assessorId: string;
    diagnosticTestResult: boolean;
    diagnosticTestEvidence: string;
    canUnderstand: boolean | null;
    canUnderstandEvidence: string | null;
    canRetain: boolean | null;
    canRetainEvidence: string | null;
    canUseOrWeigh: boolean | null;
    canUseOrWeighEvidence: string | null;
    canCommunicate: boolean | null;
    canCommunicateEvidence: string | null;
    supportStepsTaken: string;
    assessmentDate: Date;
    reviewDate: Date | null;
  };
  outcome: McaOutcome;
  bestInterestDecision?: {
    decisionBeingMade: string;
    personsConsulted: PersonConsulted[];
    personWishesFeelingsBeliefs: string;
    lessRestrictiveOptionsConsidered: string;
    decisionReached: string;
    decisionMakerName: string;
    decisionMakerRole: string;
    decisionDate: Date;
    reviewDate: Date | null;
  };
}

type WizardStep = 'diagnostic' | 'functional' | 'best-interest' | 'review';

export function McaWizard({
  personId,
  personName,
  assessorId,
  onComplete,
  onCancel,
}: McaWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('diagnostic');

  // Diagnostic test state
  const [decision, setDecision] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<boolean | null>(null);
  const [diagnosticEvidence, setDiagnosticEvidence] = useState('');
  const [supportSteps, setSupportSteps] = useState('');

  // Functional test state
  const [canUnderstand, setCanUnderstand] = useState<boolean | null>(null);
  const [canUnderstandEvidence, setCanUnderstandEvidence] = useState('');
  const [canRetain, setCanRetain] = useState<boolean | null>(null);
  const [canRetainEvidence, setCanRetainEvidence] = useState('');
  const [canUseOrWeigh, setCanUseOrWeigh] = useState<boolean | null>(null);
  const [canUseOrWeighEvidence, setCanUseOrWeighEvidence] = useState('');
  const [canCommunicate, setCanCommunicate] = useState<boolean | null>(null);
  const [canCommunicateEvidence, setCanCommunicateEvidence] = useState('');

  // Best interest state
  const [biDecision, setBiDecision] = useState('');
  const [personsConsulted, setPersonsConsulted] = useState<PersonConsulted[]>([
    { name: '', role: '', relationship: '', views: '' },
  ]);
  const [wishesFeelingsBeliefs, setWishesFeelingsBeliefs] = useState('');
  const [lessRestrictiveOptions, setLessRestrictiveOptions] = useState('');
  const [decisionReached, setDecisionReached] = useState('');
  const [decisionMakerName, setDecisionMakerName] = useState('');
  const [decisionMakerRole, setDecisionMakerRole] = useState('');

  // Derived outcome
  const outcome = useMemo<McaOutcome | null>(() => {
    if (diagnosticResult === null) return null;
    if (!diagnosticResult) return 'has_capacity';
    if (
      canUnderstand === null &&
      canRetain === null &&
      canUseOrWeigh === null &&
      canCommunicate === null
    ) {
      return null;
    }
    return deriveMcaOutcome({
      diagnosticTestResult: diagnosticResult,
      canUnderstand,
      canRetain,
      canUseOrWeigh,
      canCommunicate,
    });
  }, [diagnosticResult, canUnderstand, canRetain, canUseOrWeigh, canCommunicate]);

  // Step computation
  const steps = useMemo<Step[]>(() => {
    const diagnosticComplete =
      diagnosticResult !== null && diagnosticEvidence.trim() !== '' && supportSteps.trim() !== '';
    const skipFunctional = diagnosticResult === false;
    const functionalComplete =
      !skipFunctional &&
      canUnderstand !== null &&
      canRetain !== null &&
      canUseOrWeigh !== null &&
      canCommunicate !== null &&
      canUnderstandEvidence.trim() !== '' &&
      canRetainEvidence.trim() !== '' &&
      canUseOrWeighEvidence.trim() !== '' &&
      canCommunicateEvidence.trim() !== '';
    const needsBestInterest = outcome === 'lacks_capacity';

    return [
      {
        number: 1,
        label: 'Diagnostic Test',
        status:
          currentStep === 'diagnostic'
            ? 'current'
            : diagnosticComplete
              ? 'complete'
              : 'upcoming',
      },
      {
        number: 2,
        label: 'Functional Test',
        status: skipFunctional
          ? 'skipped'
          : currentStep === 'functional'
            ? 'current'
            : functionalComplete
              ? 'complete'
              : 'upcoming',
      },
      {
        number: 3,
        label: 'Best Interest Decision',
        status: !needsBestInterest
          ? 'skipped'
          : currentStep === 'best-interest'
            ? 'current'
            : 'upcoming',
      },
    ];
  }, [
    currentStep,
    diagnosticResult,
    diagnosticEvidence,
    supportSteps,
    canUnderstand,
    canRetain,
    canUseOrWeigh,
    canCommunicate,
    canUnderstandEvidence,
    canRetainEvidence,
    canUseOrWeighEvidence,
    canCommunicateEvidence,
    outcome,
  ]);

  // Navigation
  const handleDiagnosticNext = useCallback(() => {
    if (diagnosticResult === null || !diagnosticEvidence.trim() || !supportSteps.trim() || !decision.trim()) return;

    if (!diagnosticResult) {
      // No impairment → has capacity, skip to review/complete
      const now = new Date();
      onComplete({
        assessment: {
          personId,
          decisionToBeAssessed: decision,
          assessorId,
          diagnosticTestResult: false,
          diagnosticTestEvidence: diagnosticEvidence,
          canUnderstand: null,
          canUnderstandEvidence: null,
          canRetain: null,
          canRetainEvidence: null,
          canUseOrWeigh: null,
          canUseOrWeighEvidence: null,
          canCommunicate: null,
          canCommunicateEvidence: null,
          supportStepsTaken: supportSteps,
          assessmentDate: now,
          reviewDate: null,
        },
        outcome: 'has_capacity',
      });
    } else {
      setCurrentStep('functional');
    }
  }, [diagnosticResult, diagnosticEvidence, supportSteps, decision, personId, assessorId, onComplete]);

  const handleFunctionalNext = useCallback(() => {
    if (
      canUnderstand === null ||
      canRetain === null ||
      canUseOrWeigh === null ||
      canCommunicate === null
    ) return;

    const derivedOutcome = deriveMcaOutcome({
      diagnosticTestResult: true,
      canUnderstand,
      canRetain,
      canUseOrWeigh,
      canCommunicate,
    });

    if (derivedOutcome === 'lacks_capacity') {
      setCurrentStep('best-interest');
    } else {
      const now = new Date();
      onComplete({
        assessment: {
          personId,
          decisionToBeAssessed: decision,
          assessorId,
          diagnosticTestResult: true,
          diagnosticTestEvidence: diagnosticEvidence,
          canUnderstand,
          canUnderstandEvidence: canUnderstandEvidence || null,
          canRetain,
          canRetainEvidence: canRetainEvidence || null,
          canUseOrWeigh,
          canUseOrWeighEvidence: canUseOrWeighEvidence || null,
          canCommunicate,
          canCommunicateEvidence: canCommunicateEvidence || null,
          supportStepsTaken: supportSteps,
          assessmentDate: now,
          reviewDate: null,
        },
        outcome: 'has_capacity',
      });
    }
  }, [
    canUnderstand, canRetain, canUseOrWeigh, canCommunicate,
    canUnderstandEvidence, canRetainEvidence, canUseOrWeighEvidence, canCommunicateEvidence,
    personId, decision, assessorId, diagnosticEvidence, supportSteps, onComplete,
  ]);

  const handleBestInterestSubmit = useCallback(() => {
    const now = new Date();
    onComplete({
      assessment: {
        personId,
        decisionToBeAssessed: decision,
        assessorId,
        diagnosticTestResult: true,
        diagnosticTestEvidence: diagnosticEvidence,
        canUnderstand,
        canUnderstandEvidence: canUnderstandEvidence || null,
        canRetain,
        canRetainEvidence: canRetainEvidence || null,
        canUseOrWeigh,
        canUseOrWeighEvidence: canUseOrWeighEvidence || null,
        canCommunicate,
        canCommunicateEvidence: canCommunicateEvidence || null,
        supportStepsTaken: supportSteps,
        assessmentDate: now,
        reviewDate: null,
      },
      outcome: 'lacks_capacity',
      bestInterestDecision: {
        decisionBeingMade: biDecision,
        personsConsulted,
        personWishesFeelingsBeliefs: wishesFeelingsBeliefs,
        lessRestrictiveOptionsConsidered: lessRestrictiveOptions,
        decisionReached,
        decisionMakerName,
        decisionMakerRole,
        decisionDate: now,
        reviewDate: null,
      },
    });
  }, [
    personId, decision, assessorId, diagnosticEvidence,
    canUnderstand, canUnderstandEvidence, canRetain, canRetainEvidence,
    canUseOrWeigh, canUseOrWeighEvidence, canCommunicate, canCommunicateEvidence,
    supportSteps, biDecision, personsConsulted, wishesFeelingsBeliefs,
    lessRestrictiveOptions, decisionReached, decisionMakerName, decisionMakerRole,
    onComplete,
  ]);

  const addConsultedPerson = () => {
    setPersonsConsulted((prev) => [
      ...prev,
      { name: '', role: '', relationship: '', views: '' },
    ]);
  };

  const updateConsultedPerson = (index: number, field: keyof PersonConsulted, value: string) => {
    setPersonsConsulted((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const removeConsultedPerson = (index: number) => {
    setPersonsConsulted((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Mental Capacity Assessment
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Assessment for {personName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Mental Capacity Act 2005 — Two-stage test of capacity
        </p>
      </div>

      <StepIndicator steps={steps} />

      {/* Step 1: Diagnostic Test */}
      {currentStep === 'diagnostic' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Stage 1: Diagnostic Test
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Determine whether there is an impairment of, or disturbance in, the functioning of the person&apos;s mind or brain.
            </p>

            <div className="mt-6 space-y-5">
              <FormField
                label="Decision to be assessed"
                htmlFor="decision"
                required
                description="What specific decision is this assessment about?"
              >
                <TextArea
                  id="decision"
                  value={decision}
                  onChange={setDecision}
                  placeholder="e.g., Whether to move to a residential care home..."
                />
              </FormField>

              <FormField
                label="Is there an impairment of, or disturbance in, the functioning of the mind or brain?"
                htmlFor="diagnostic"
                required
              >
                <YesNoToggle
                  id="diagnostic"
                  value={diagnosticResult}
                  onChange={setDiagnosticResult}
                />
              </FormField>

              <FormField
                label="Evidence"
                htmlFor="diagnostic-evidence"
                required
                description="Record the evidence supporting your diagnostic assessment"
              >
                <TextArea
                  id="diagnostic-evidence"
                  value={diagnosticEvidence}
                  onChange={setDiagnosticEvidence}
                  placeholder="Describe the nature of the impairment or disturbance, or why there is none..."
                  rows={4}
                />
              </FormField>

              <FormField
                label="Steps taken to support decision-making"
                htmlFor="support-steps"
                required
                description="What practical steps were taken to help the person make their own decision?"
              >
                <TextArea
                  id="support-steps"
                  value={supportSteps}
                  onChange={setSupportSteps}
                  placeholder="e.g., Information provided in simple language, visual aids used, assessment conducted at optimal time of day..."
                  rows={3}
                />
              </FormField>

              {diagnosticResult === false && (
                <OutcomeBadge outcome="has_capacity" />
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700
                         hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDiagnosticNext}
              disabled={diagnosticResult === null || !diagnosticEvidence.trim() || !supportSteps.trim() || !decision.trim()}
              className="rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white
                         hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed
                         transition-colors"
            >
              {diagnosticResult === false ? 'Complete Assessment' : 'Continue to Functional Test'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Functional Test */}
      {currentStep === 'functional' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Stage 2: Functional Test
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Assess whether the person can make the specific decision. Failing <strong>any one</strong> criterion means the person lacks capacity for this decision.
            </p>

            <div className="mt-6 space-y-4">
              <FunctionalCriterion
                id="understand"
                question="Can the person understand the information relevant to the decision?"
                value={canUnderstand}
                onValueChange={setCanUnderstand}
                evidence={canUnderstandEvidence}
                onEvidenceChange={setCanUnderstandEvidence}
              />
              <FunctionalCriterion
                id="retain"
                question="Can the person retain that information long enough to make the decision?"
                value={canRetain}
                onValueChange={setCanRetain}
                evidence={canRetainEvidence}
                onEvidenceChange={setCanRetainEvidence}
              />
              <FunctionalCriterion
                id="use-weigh"
                question="Can the person use or weigh that information as part of the decision-making process?"
                value={canUseOrWeigh}
                onValueChange={setCanUseOrWeigh}
                evidence={canUseOrWeighEvidence}
                onEvidenceChange={setCanUseOrWeighEvidence}
              />
              <FunctionalCriterion
                id="communicate"
                question="Can the person communicate their decision (by any means)?"
                value={canCommunicate}
                onValueChange={setCanCommunicate}
                evidence={canCommunicateEvidence}
                onEvidenceChange={setCanCommunicateEvidence}
              />
            </div>

            <OutcomeBadge outcome={outcome} />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep('diagnostic')}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700
                         hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleFunctionalNext}
              disabled={
                canUnderstand === null ||
                canRetain === null ||
                canUseOrWeigh === null ||
                canCommunicate === null ||
                !canUnderstandEvidence.trim() ||
                !canRetainEvidence.trim() ||
                !canUseOrWeighEvidence.trim() ||
                !canCommunicateEvidence.trim()
              }
              className="rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white
                         hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed
                         transition-colors"
            >
              {outcome === 'lacks_capacity' ? 'Continue to Best Interest Decision' : 'Complete Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Best Interest Decision */}
      {currentStep === 'best-interest' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Best Interest Decision
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The person lacks capacity for this decision. A best interest decision must be recorded under s4 Mental Capacity Act 2005.
            </p>

            <div className="mt-6 space-y-5">
              <FormField
                label="Decision being made"
                htmlFor="bi-decision"
                required
              >
                <TextArea
                  id="bi-decision"
                  value={biDecision}
                  onChange={setBiDecision}
                  placeholder="What decision is being made in the person's best interest?"
                />
              </FormField>

              {/* Persons consulted */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">
                    Persons consulted <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addConsultedPerson}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    + Add person
                  </button>
                </div>
                {personsConsulted.map((person, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-slate-200 bg-white p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Person {idx + 1}</span>
                      {personsConsulted.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeConsultedPerson(idx)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={person.name}
                        onChange={(e) => updateConsultedPerson(idx, 'name', e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm
                                   focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Role"
                        value={person.role}
                        onChange={(e) => updateConsultedPerson(idx, 'role', e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm
                                   focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Relationship"
                        value={person.relationship}
                        onChange={(e) => updateConsultedPerson(idx, 'relationship', e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm
                                   focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                      />
                    </div>
                    <textarea
                      placeholder="Their views..."
                      value={person.views}
                      onChange={(e) => updateConsultedPerson(idx, 'views', e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm
                                 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                    />
                  </div>
                ))}
              </div>

              <FormField
                label="Person's wishes, feelings, beliefs and values"
                htmlFor="wishes"
                required
                description="Past and present wishes, feelings, beliefs, and values that would be relevant"
              >
                <TextArea
                  id="wishes"
                  value={wishesFeelingsBeliefs}
                  onChange={setWishesFeelingsBeliefs}
                  rows={4}
                />
              </FormField>

              <FormField
                label="Less restrictive options considered"
                htmlFor="less-restrictive"
                required
              >
                <TextArea
                  id="less-restrictive"
                  value={lessRestrictiveOptions}
                  onChange={setLessRestrictiveOptions}
                  placeholder="What alternatives were considered and why were they not suitable?"
                />
              </FormField>

              <FormField label="Decision reached" htmlFor="decision-reached" required>
                <TextArea
                  id="decision-reached"
                  value={decisionReached}
                  onChange={setDecisionReached}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Decision maker name" htmlFor="dm-name" required>
                  <input
                    id="dm-name"
                    type="text"
                    value={decisionMakerName}
                    onChange={(e) => setDecisionMakerName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm
                               focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </FormField>
                <FormField label="Decision maker role" htmlFor="dm-role" required>
                  <input
                    id="dm-role"
                    type="text"
                    value={decisionMakerRole}
                    onChange={(e) => setDecisionMakerRole(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm
                               focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep('functional')}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700
                         hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleBestInterestSubmit}
              disabled={
                !biDecision.trim() ||
                !wishesFeelingsBeliefs.trim() ||
                !lessRestrictiveOptions.trim() ||
                !decisionReached.trim() ||
                !decisionMakerName.trim() ||
                !decisionMakerRole.trim() ||
                personsConsulted.some((p) => !p.name.trim() || !p.views.trim())
              }
              className="rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white
                         hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed
                         transition-colors"
            >
              Complete Assessment & Best Interest Decision
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
