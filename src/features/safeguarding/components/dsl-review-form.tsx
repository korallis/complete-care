'use client';

/**
 * DSL Review Form (VAL-CHILD-009)
 *
 * Designated Safeguarding Lead reviews a concern and makes one of four decisions:
 * 1. Internal monitoring
 * 2. Refer to MASH
 * 3. Refer to LADO
 * 4. Refer to Police
 *
 * For external referrals, additional fields capture referral tracking details.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createDslReviewSchema,
  type CreateDslReviewInput,
} from '@/features/safeguarding/schema';
import {
  DSL_DECISION_LABELS,
  DSL_DECISION_DESCRIPTIONS,
} from '@/features/safeguarding/constants';
import { DSL_DECISIONS } from '@/lib/db/schema/safeguarding';
import type { SafeguardingConcern } from '@/lib/db/schema/safeguarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Shield,
  ArrowRight,
  Building2,
  Phone,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DslReviewFormProps {
  concern: SafeguardingConcern;
  onSubmit: (data: CreateDslReviewInput) => Promise<void>;
  onCancel?: () => void;
}

const DECISION_ICONS: Record<string, React.ElementType> = {
  internal_monitoring: FileCheck,
  refer_to_mash: Building2,
  refer_to_lado: Shield,
  refer_to_police: Phone,
};

const DECISION_COLORS: Record<string, string> = {
  internal_monitoring: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
  refer_to_mash: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
  refer_to_lado: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
  refer_to_police: 'border-red-200 bg-red-50 hover:bg-red-100',
};

const DECISION_SELECTED_COLORS: Record<string, string> = {
  internal_monitoring: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300',
  refer_to_mash: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300',
  refer_to_lado: 'border-orange-500 bg-orange-100 ring-2 ring-orange-300',
  refer_to_police: 'border-red-500 bg-red-100 ring-2 ring-red-300',
};

export function DslReviewForm({
  concern,
  onSubmit,
  onCancel,
}: DslReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateDslReviewInput>({
    resolver: zodResolver(createDslReviewSchema),
    defaultValues: {
      concernId: concern.id,
      decision: undefined,
      rationale: '',
      riskAssessment: '',
      additionalActions: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedDecision = watch('decision');
  const isExternalReferral =
    selectedDecision === 'refer_to_mash' ||
    selectedDecision === 'refer_to_lado' ||
    selectedDecision === 'refer_to_police';

  async function onFormSubmit(data: CreateDslReviewInput) {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Concern Summary */}
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Concern Under Review</CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              {concern.referenceNumber}
            </Badge>
          </div>
          <CardDescription className="line-clamp-3 text-sm">
            {concern.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Observed: {new Date(concern.observedAt).toLocaleString('en-GB')}</span>
            <span>Severity: {concern.severity}</span>
            {concern.category && <span>Category: {concern.category}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Decision Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            Decision Pathway <span className="text-destructive">*</span>
          </CardTitle>
          <CardDescription>
            Select the appropriate safeguarding response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {DSL_DECISIONS.map((decision) => {
              const Icon = DECISION_ICONS[decision] ?? FileCheck;
              const isSelected = selectedDecision === decision;
              return (
                <button
                  key={decision}
                  type="button"
                  onClick={() => setValue('decision', decision, { shouldValidate: true })}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-all',
                    isSelected
                      ? DECISION_SELECTED_COLORS[decision]
                      : DECISION_COLORS[decision],
                  )}
                >
                  <Icon
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-60',
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {DSL_DECISION_LABELS[decision]}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {DSL_DECISION_DESCRIPTIONS[decision]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.decision && (
            <p className="mt-2 text-xs text-destructive">{errors.decision.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Rationale and Risk Assessment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Review Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rationale">
              Rationale for Decision <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rationale"
              placeholder="Explain the reasoning behind your decision, referencing the evidence from the concern and any additional information gathered..."
              rows={4}
              className="resize-y text-sm"
              {...register('rationale')}
            />
            {errors.rationale && (
              <p className="text-xs text-destructive">{errors.rationale.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="riskAssessment">Risk Assessment</Label>
            <Textarea
              id="riskAssessment"
              placeholder="Assess the current risk level to the child and any other children who may be affected..."
              rows={3}
              className="resize-y text-sm"
              {...register('riskAssessment')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalActions">Additional Actions Required</Label>
            <Textarea
              id="additionalActions"
              placeholder="Any immediate or follow-up actions needed..."
              rows={2}
              className="resize-y text-sm"
              {...register('additionalActions')}
            />
          </div>
        </CardContent>
      </Card>

      {/* External Referral Details */}
      {isExternalReferral && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              External Referral Details
            </CardTitle>
            <CardDescription>
              Complete the referral tracking information for the external agency.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="referralDate">
                Referral Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="referralDate"
                type="datetime-local"
                className="font-mono text-sm"
                {...register('referralDate', { valueAsDate: true })}
              />
              {errors.referralDate && (
                <p className="text-xs text-destructive">
                  {errors.referralDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralAgency">Receiving Agency</Label>
              <Input
                id="referralAgency"
                placeholder="Name of agency"
                className="text-sm"
                {...register('referralAgency')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralReference">Agency Reference Number</Label>
              <Input
                id="referralReference"
                placeholder="Reference from receiving agency"
                className="font-mono text-sm"
                {...register('referralReference')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedResponseDate">Expected Response By</Label>
              <Input
                id="expectedResponseDate"
                type="datetime-local"
                className="font-mono text-sm"
                {...register('expectedResponseDate', { valueAsDate: true })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !selectedDecision}
          className="min-w-[160px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Recording...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Record Decision
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
