'use client';

/**
 * MASH Referral Form (VAL-CHILD-009)
 *
 * Multi-Agency Safeguarding Hub referral tracking.
 * Captures reference numbers and outcomes.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createMashReferralSchema,
  type CreateMashReferralInput,
} from '@/features/safeguarding/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface MashReferralFormProps {
  childId: string;
  childName: string;
  concernId?: string;
  dslReviewId?: string;
  onSubmit: (data: CreateMashReferralInput) => Promise<void>;
  onCancel?: () => void;
}

export function MashReferralForm({
  childId,
  childName,
  concernId,
  dslReviewId,
  onSubmit,
  onCancel,
}: MashReferralFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateMashReferralInput>({
    resolver: zodResolver(createMashReferralSchema),
    defaultValues: {
      childId,
      concernId: concernId ?? null,
      dslReviewId: dslReviewId ?? null,
      referralDate: new Date(),
      referralReason: '',
      referralAgency: '',
      mashReference: '',
      expectedResponseDate: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onFormSubmit(data: CreateMashReferralInput) {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              MASH Referral — {childName}
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Multi-Agency Safeguarding Hub referral for coordinated assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Referral Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Referral Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder="MASH team / local authority"
                className="text-sm"
                {...register('referralAgency')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mashReference">MASH Reference Number</Label>
              <Input
                id="mashReference"
                placeholder="Reference from MASH"
                className="font-mono text-sm"
                {...register('mashReference')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedResponseDate">
                Expected Response Date
              </Label>
              <Input
                id="expectedResponseDate"
                type="datetime-local"
                className="font-mono text-sm"
                {...register('expectedResponseDate', { valueAsDate: true })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralReason">
              Reason for Referral <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="referralReason"
              placeholder="Provide a detailed account of the reason for referral to MASH..."
              rows={5}
              className="resize-y text-sm"
              {...register('referralReason')}
            />
            {errors.referralReason && (
              <p className="text-xs text-destructive">
                {errors.referralReason.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Submit MASH Referral
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
