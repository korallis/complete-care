'use client';

/**
 * Section 47 Investigation Form (VAL-CHILD-010)
 *
 * Tracks strategy meeting dates, attendees, decisions, and outcomes
 * for Section 47 (Children Act 1989) cooperation.
 */

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSection47Schema,
  type CreateSection47Input,
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
import { AlertTriangle, Plus, Trash2, Users } from 'lucide-react';

interface Section47FormProps {
  childId: string;
  childName: string;
  concernId?: string;
  onSubmit: (data: CreateSection47Input) => Promise<void>;
  onCancel?: () => void;
}

export function Section47Form({
  childId,
  childName,
  concernId,
  onSubmit,
  onCancel,
}: Section47FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateSection47Input>({
    resolver: zodResolver(createSection47Schema),
    defaultValues: {
      childId,
      concernId: concernId ?? null,
      localAuthorityReference: '',
      socialWorkerName: '',
      socialWorkerContact: '',
      strategyMeetingDate: undefined,
      strategyMeetingAttendees: [{ name: '', role: '', organisation: '' }],
      strategyMeetingDecisions: '',
      notes: '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'strategyMeetingAttendees',
  });

  async function onFormSubmit(data: CreateSection47Input) {
    setIsSubmitting(true);
    try {
      // Filter out empty attendee rows
      const filtered = {
        ...data,
        strategyMeetingAttendees: data.strategyMeetingAttendees?.filter(
          (a) => a.name.trim() !== '',
        ),
      };
      await onSubmit(filtered);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border-l-4 border-l-rose-500 bg-rose-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-900">
              Section 47 Investigation — {childName}
            </p>
            <p className="mt-0.5 text-xs text-rose-700">
              Children Act 1989 — Section 47 enquiry cooperation tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Reference and Social Worker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Investigation Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="localAuthorityReference">
              Local Authority Reference
            </Label>
            <Input
              id="localAuthorityReference"
              placeholder="LA reference number"
              className="font-mono text-sm"
              {...register('localAuthorityReference')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strategyMeetingDate">Strategy Meeting Date</Label>
            <Input
              id="strategyMeetingDate"
              type="datetime-local"
              className="font-mono text-sm"
              {...register('strategyMeetingDate', { valueAsDate: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialWorkerName">Social Worker Name</Label>
            <Input
              id="socialWorkerName"
              placeholder="Allocated social worker"
              className="text-sm"
              {...register('socialWorkerName')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialWorkerContact">Social Worker Contact</Label>
            <Input
              id="socialWorkerContact"
              placeholder="Phone or email"
              className="text-sm"
              {...register('socialWorkerContact')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Strategy Meeting Attendees */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            Strategy Meeting Attendees
          </CardTitle>
          <CardDescription>
            Record all professionals attending the strategy meeting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
            >
              <div className="space-y-1">
                {index === 0 && (
                  <Label className="text-xs text-muted-foreground">Name</Label>
                )}
                <Input
                  placeholder="Name"
                  className="text-sm"
                  {...register(`strategyMeetingAttendees.${index}.name`)}
                />
              </div>
              <div className="space-y-1">
                {index === 0 && (
                  <Label className="text-xs text-muted-foreground">Role</Label>
                )}
                <Input
                  placeholder="Role"
                  className="text-sm"
                  {...register(`strategyMeetingAttendees.${index}.role`)}
                />
              </div>
              <div className="space-y-1">
                {index === 0 && (
                  <Label className="text-xs text-muted-foreground">
                    Organisation
                  </Label>
                )}
                <Input
                  placeholder="Organisation"
                  className="text-sm"
                  {...register(
                    `strategyMeetingAttendees.${index}.organisation`,
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', role: '', organisation: '' })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Attendee
          </Button>
        </CardContent>
      </Card>

      {/* Decisions and Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Decisions &amp; Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strategyMeetingDecisions">
              Strategy Meeting Decisions
            </Label>
            <Textarea
              id="strategyMeetingDecisions"
              placeholder="Record decisions made at the strategy meeting..."
              rows={4}
              className="resize-y text-sm"
              {...register('strategyMeetingDecisions')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
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
          className="min-w-[160px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </span>
          ) : (
            'Save Investigation'
          )}
        </Button>
      </div>
    </form>
  );
}
