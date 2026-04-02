'use client';

import { useActionState } from 'react';
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
import {
  Select,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { createMatchingAssessment } from '../actions';

interface MatchingAssessmentFormProps {
  referralId: string;
  childName: string;
}

type FormState = {
  success: boolean;
  error?: string;
};

async function submitAssessment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const data = {
      referralId: formData.get('referralId') as string,
      riskToRating: formData.get('riskToRating') as string,
      riskFromRating: formData.get('riskFromRating') as string,
      currentOccupancy: formData.get('currentOccupancy')
        ? Number(formData.get('currentOccupancy'))
        : undefined,
      maxCapacity: formData.get('maxCapacity')
        ? Number(formData.get('maxCapacity'))
        : undefined,
      bedsAvailable: formData.get('bedsAvailable')
        ? Number(formData.get('bedsAvailable'))
        : undefined,
      capacityNotes: formData.get('capacityNotes') as string,
      overallRiskRating: formData.get('overallRiskRating') as string,
      recommendation: formData.get('recommendation') as string,
      recommendationRationale: formData.get(
        'recommendationRationale',
      ) as string,
      conditions: formData.get('conditions') as string,
    };

    await createMatchingAssessment(data);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to submit assessment',
    };
  }
}

export function MatchingAssessmentForm({
  referralId,
  childName,
}: MatchingAssessmentFormProps) {
  const [state, formAction, isPending] = useActionState(submitAssessment, {
    success: false,
  });

  if (state.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Assessment submitted</p>
          <p className="text-sm text-muted-foreground">
            The matching assessment for {childName} has been recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="referralId" value={referralId} />

      {state.error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Risk-to assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk-to assessment</CardTitle>
          <CardDescription>
            Risks the referred child ({childName}) may pose to existing
            children in the home.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="riskToRating">Risk-to rating *</Label>
            <Select name="riskToRating" required>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Risk-from assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk-from assessment</CardTitle>
          <CardDescription>
            Risks existing children in the home may pose to {childName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="riskFromRating">Risk-from rating *</Label>
            <Select name="riskFromRating" required>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Capacity assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Home capacity</CardTitle>
          <CardDescription>
            Current occupancy and bed availability.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currentOccupancy">Current occupancy</Label>
            <Input
              id="currentOccupancy"
              name="currentOccupancy"
              type="number"
              min={0}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxCapacity">Max capacity</Label>
            <Input
              id="maxCapacity"
              name="maxCapacity"
              type="number"
              min={0}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedsAvailable">Beds available</Label>
            <Input
              id="bedsAvailable"
              name="bedsAvailable"
              type="number"
              min={0}
              placeholder="0"
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="capacityNotes">Capacity notes</Label>
            <Textarea
              id="capacityNotes"
              name="capacityNotes"
              placeholder="Any notes regarding capacity constraints, room configurations, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Overall assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Overall assessment</CardTitle>
          <CardDescription>
            Combined risk rating and recommendation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="overallRiskRating">
                Overall risk rating *
              </Label>
              <Select name="overallRiskRating" required>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendation">Recommendation *</Label>
              <Select name="recommendation" required>
                    Accept with conditions
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recommendationRationale">
              Recommendation rationale *
            </Label>
            <Textarea
              id="recommendationRationale"
              name="recommendationRationale"
              required
              placeholder="Explain the reasoning behind this recommendation..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conditions">
              Conditions (if accepting with conditions)
            </Label>
            <Textarea
              id="conditions"
              name="conditions"
              placeholder="Specify any conditions that must be met..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit assessment'}
        </Button>
      </div>
    </form>
  );
}
