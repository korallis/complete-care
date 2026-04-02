'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { recordDecision } from '../actions';

interface DecisionFormProps {
  referralId: string;
  childName: string;
}

type FormState = {
  success: boolean;
  error?: string;
  decision?: string;
};

async function submitDecision(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const data = {
      referralId: formData.get('referralId') as string,
      decision: formData.get('decision') as 'accepted' | 'declined',
      reason: formData.get('reason') as string,
      acceptanceConditions: formData.get('acceptanceConditions') as string,
    };

    await recordDecision(data);
    return { success: true, decision: data.decision };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to record decision',
    };
  }
}

export function DecisionForm({ referralId, childName }: DecisionFormProps) {
  const [state, formAction, isPending] = useActionState(submitDecision, {
    success: false,
  });

  if (state.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">
            Decision recorded:{' '}
            {state.decision === 'accepted' ? 'Accepted' : 'Declined'}
          </p>
          <p className="text-sm text-muted-foreground">
            {state.decision === 'accepted'
              ? `${childName} has been accepted. The admission checklist is now available.`
              : `The referral for ${childName} has been declined and archived.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acceptance decision</CardTitle>
        <CardDescription>
          Record your decision for the referral of {childName}. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="referralId" value={referralId} />

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Decision reason *</Label>
            <Textarea
              id="reason"
              name="reason"
              required
              placeholder="Explain the reasoning for this decision..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acceptanceConditions">
              Acceptance conditions (optional)
            </Label>
            <Textarea
              id="acceptanceConditions"
              name="acceptanceConditions"
              placeholder="If accepting with conditions, specify them here..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              name="decision"
              value="declined"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? 'Processing...' : 'Decline referral'}
            </Button>
            <Button
              type="submit"
              name="decision"
              value="accepted"
              disabled={isPending}
            >
              {isPending ? 'Processing...' : 'Accept referral'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
