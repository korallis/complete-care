'use client';

/**
 * LADO Referral Form (VAL-CHILD-010)
 *
 * Restricted-access form for recording allegations against staff.
 * Only visible to DSL + senior leadership roles.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createLadoReferralSchema,
  type CreateLadoReferralInput,
} from '@/features/safeguarding/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lock, Shield } from 'lucide-react';

interface LadoReferralFormProps {
  childId: string;
  childName: string;
  concernId?: string;
  dslReviewId?: string;
  onSubmit: (data: CreateLadoReferralInput) => Promise<void>;
  onCancel?: () => void;
}

export function LadoReferralForm({
  childId,
  childName,
  concernId,
  dslReviewId,
  onSubmit,
  onCancel,
}: LadoReferralFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateLadoReferralInput>({
    resolver: zodResolver(createLadoReferralSchema),
    defaultValues: {
      childId,
      concernId: concernId ?? null,
      dslReviewId: dslReviewId ?? null,
      allegationAgainstStaffName: '',
      allegationDetails: '',
      allegationCategory: '',
      ladoReference: '',
      ladoOfficerName: '',
      ladoOfficerContact: '',
      referralDate: new Date(),
      notes: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onFormSubmit(data: CreateLadoReferralInput) {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Restricted Access Banner */}
      <div className="rounded-lg border-l-4 border-l-red-500 bg-red-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Restricted Access — LADO Referral
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              This record is only visible to the Designated Safeguarding Lead
              and senior leadership. It relates to allegations against a staff
              member.
            </p>
          </div>
        </div>
      </div>

      {/* Child and Staff Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Allegation Details</CardTitle>
          <CardDescription>
            Recording LADO referral for child:{' '}
            <span className="font-medium text-foreground">{childName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allegationAgainstStaffName">
                Staff Member Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="allegationAgainstStaffName"
                placeholder="Full name of staff member"
                className="text-sm"
                {...register('allegationAgainstStaffName')}
              />
              {errors.allegationAgainstStaffName && (
                <p className="text-xs text-destructive">
                  {errors.allegationAgainstStaffName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="allegationCategory">Allegation Category</Label>
              <Input
                id="allegationCategory"
                placeholder="e.g. Physical, Emotional, Sexual"
                className="text-sm"
                {...register('allegationCategory')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allegationDetails">
              Allegation Details <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="allegationDetails"
              placeholder="Provide a detailed factual account of the allegation..."
              rows={5}
              className="resize-y text-sm"
              {...register('allegationDetails')}
            />
            {errors.allegationDetails && (
              <p className="text-xs text-destructive">
                {errors.allegationDetails.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* LADO Contact Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">LADO Contact Information</CardTitle>
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
            <Label htmlFor="ladoReference">LADO Reference Number</Label>
            <Input
              id="ladoReference"
              placeholder="Reference from LADO"
              className="font-mono text-sm"
              {...register('ladoReference')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ladoOfficerName">LADO Officer Name</Label>
            <Input
              id="ladoOfficerName"
              placeholder="Name of designated officer"
              className="text-sm"
              {...register('ladoOfficerName')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ladoOfficerContact">LADO Officer Contact</Label>
            <Input
              id="ladoOfficerContact"
              placeholder="Phone or email"
              className="text-sm"
              {...register('ladoOfficerContact')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information relevant to the referral..."
              rows={3}
              className="resize-y text-sm"
              {...register('notes')}
            />
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
          className="min-w-[160px] bg-red-600 hover:bg-red-700"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Submit LADO Referral
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
