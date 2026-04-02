'use client';

/**
 * Safeguarding Concern Recording Form (VAL-CHILD-008)
 *
 * Any staff member can raise a safeguarding concern.
 * Captures: verbatim account, body map link, date/time, child presentation.
 * Concerns are immutable after submission (append-only corrections).
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createConcernSchema,
  type CreateConcernInput,
} from '@/features/safeguarding/schema';
import {
  CONCERN_CATEGORIES,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from '@/features/safeguarding/constants';
import { CONCERN_SEVERITIES } from '@/lib/db/schema/safeguarding';
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
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ShieldAlert,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  FileText,
  Quote,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConcernFormProps {
  childId: string;
  childName: string;
  onSubmit: (data: CreateConcernInput) => Promise<void>;
  onCancel?: () => void;
}

export function ConcernForm({
  childId,
  childName,
  onSubmit,
  onCancel,
}: ConcernFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBodyMapLink, setShowBodyMapLink] = useState(false);

  const form = useForm<CreateConcernInput>({
    resolver: zodResolver(createConcernSchema),
    defaultValues: {
      childId,
      severity: 'medium',
      observedAt: new Date(),
      description: '',
      verbatimAccount: '',
      childPresentation: '',
      location: '',
      category: '',
      witnesses: '',
      immediateActions: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedSeverity = watch('severity');

  async function onFormSubmit(data: CreateConcernInput) {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Safeguarding Concern — Confidential
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              This record will be immutable after submission. Record facts
              accurately. Use the child&apos;s exact words where possible.
            </p>
          </div>
        </div>
      </div>

      {/* Child Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subject</CardTitle>
          <CardDescription>
            Recording concern for{' '}
            <span className="font-medium text-foreground">{childName}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Date/Time and Severity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            When and How Serious
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="observedAt">
              Date &amp; Time Observed <span className="text-destructive">*</span>
            </Label>
            <Input
              id="observedAt"
              type="datetime-local"
              {...register('observedAt', { valueAsDate: true })}
              className="font-mono text-sm"
            />
            {errors.observedAt && (
              <p className="text-xs text-destructive">{errors.observedAt.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              Severity <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              {CONCERN_SEVERITIES.map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setValue('severity', severity)}
                  className={cn(
                    'flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-all',
                    selectedSeverity === severity
                      ? cn(SEVERITY_COLORS[severity], 'ring-2 ring-offset-1 ring-current')
                      : 'border-border bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {SEVERITY_LABELS[severity]}
                </button>
              ))}
            </div>
            {errors.severity && (
              <p className="text-xs text-destructive">{errors.severity.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description and Verbatim Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Concern Details
          </CardTitle>
          <CardDescription>
            Record precisely what happened. Use factual, objective language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Description of Concern <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what you observed, heard, or were told. Include specific details: who, what, where, when..."
              rows={5}
              className="resize-y text-sm"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="verbatimAccount">
                Child&apos;s Own Words (Verbatim)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Record exactly what the child said, using their own words and
              language. Do not interpret or paraphrase.
            </p>
            <Textarea
              id="verbatimAccount"
              placeholder='"The child said: ...'
              rows={4}
              className="resize-y border-l-2 border-l-blue-300 bg-blue-50/30 text-sm italic"
              {...register('verbatimAccount')}
            />
            {errors.verbatimAccount && (
              <p className="text-xs text-destructive">
                {errors.verbatimAccount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="childPresentation">Child&apos;s Presentation</Label>
            </div>
            <Textarea
              id="childPresentation"
              placeholder="Describe the child's demeanour, emotional state, physical appearance, behaviour..."
              rows={3}
              className="resize-y text-sm"
              {...register('childPresentation')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category and Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Classification
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category of Concern</Label>
            <Select
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setValue('category', e.target.value)}
              className="text-sm"
            >
              <option value="">Select category...</option>
              {CONCERN_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="inline h-3.5 w-3.5 mr-1" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Where did this occur?"
              className="text-sm"
              {...register('location')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Body Map Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Body Map Record</p>
              <p className="text-xs text-muted-foreground">
                Link to a body map documenting any visible marks or injuries.
              </p>
            </div>
            <Button
              type="button"
              variant={showBodyMapLink ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowBodyMapLink(!showBodyMapLink)}
            >
              {showBodyMapLink ? 'Body Map Linked' : 'Link Body Map'}
            </Button>
          </div>
          {showBodyMapLink && (
            <div className="mt-3 space-y-2">
              <Label htmlFor="bodyMapId">Body Map Record ID</Label>
              <Input
                id="bodyMapId"
                placeholder="Enter body map record UUID"
                className="font-mono text-sm"
                {...register('bodyMapId')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Witnesses and Immediate Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="witnesses">Witnesses</Label>
            <Textarea
              id="witnesses"
              placeholder="Names and roles of any witnesses present..."
              rows={2}
              className="resize-y text-sm"
              {...register('witnesses')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="immediateActions">Immediate Actions Taken</Label>
            <Textarea
              id="immediateActions"
              placeholder="Describe any immediate steps taken to ensure the child's safety..."
              rows={3}
              className="resize-y text-sm"
              {...register('immediateActions')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Immutability Warning + Submit */}
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              This record cannot be edited after submission.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              If a correction is needed later, it will be appended as a
              separate correction record, preserving the original submission.
            </p>
          </div>
        </div>
      </div>

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
              <ShieldAlert className="h-4 w-4" />
              Submit Concern
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
