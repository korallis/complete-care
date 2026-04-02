'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { updateChecklistItem, completeAdmission } from '../actions';
import type { AdmissionChecklistItem } from '@/lib/db/schema/admissions';

interface AdmissionChecklistProps {
  referralId: string;
  childName: string;
  items: AdmissionChecklistItem[];
}

type ToggleState = { success: boolean; error?: string };

async function toggleItem(
  _prev: ToggleState,
  formData: FormData,
): Promise<ToggleState> {
  try {
    await updateChecklistItem({
      id: formData.get('itemId') as string,
      completed: formData.get('completed') === 'true',
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update item',
    };
  }
}

type AdmitState = {
  success: boolean;
  error?: string;
  incompleteItems?: string[];
};

async function admit(
  _prev: AdmitState,
  formData: FormData,
): Promise<AdmitState> {
  try {
    const result = await completeAdmission({
      referralId: formData.get('referralId') as string,
    });
    if (!result.success && 'error' in result) {
      return {
        success: false,
        error: result.error,
        incompleteItems:
          'incompleteItems' in result
            ? (result.incompleteItems as string[])
            : undefined,
      };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to complete admission',
    };
  }
}

function ChecklistItemRow({ item }: { item: AdmissionChecklistItem }) {
  const [, formAction, isPending] = useActionState(toggleItem, {
    success: false,
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={item.id} />
      <input
        type="hidden"
        name="completed"
        value={String(!item.completed)}
      />
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
              item.completed
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/30 hover:border-primary'
            }`}
            aria-label={
              item.completed
                ? `Mark "${item.title}" incomplete`
                : `Mark "${item.title}" complete`
            }
          >
            {item.completed && (
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
          <div>
            <p
              className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}
            >
              {item.title}
              {item.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </p>
            {item.description && (
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
          {item.completed && item.completedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(item.completedAt).toLocaleDateString('en-GB')}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}

export function AdmissionChecklist({
  referralId,
  childName,
  items,
}: AdmissionChecklistProps) {
  const [admitState, admitAction, isAdmitting] = useActionState(admit, {
    success: false,
  });

  const completedCount = items.filter((i) => i.completed).length;
  const requiredCount = items.filter((i) => i.required).length;
  const requiredCompleted = items.filter(
    (i) => i.required && i.completed,
  ).length;

  // Group by category
  const grouped = items.reduce(
    (acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, AdmissionChecklistItem[]>,
  );

  const categoryLabels: Record<string, string> = {
    documentation: 'Documentation',
    health: 'Health',
    education: 'Education',
    legal: 'Legal',
    placement_plan: 'Placement Plan',
  };

  if (admitState.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Admission complete</p>
          <p className="text-sm text-muted-foreground">
            {childName} has been formally admitted to the home.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admission checklist</CardTitle>
          <CardDescription>
            {completedCount} of {items.length} items complete ({requiredCompleted}{' '}
            of {requiredCount} required). All required items must be completed
            before admission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admitState.error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {admitState.error}
              {admitState.incompleteItems && (
                <ul className="mt-2 list-disc pl-4">
                  {admitState.incompleteItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h4 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {categoryLabels[category] ?? category}
              </h4>
              <div className="divide-y">
                {categoryItems.map((item) => (
                  <ChecklistItemRow key={item.id} item={item} />
                ))}
              </div>
              <Separator className="mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <form action={admitAction} className="flex justify-end">
        <input type="hidden" name="referralId" value={referralId} />
        <Button
          type="submit"
          disabled={isAdmitting || requiredCompleted < requiredCount}
          size="lg"
        >
          {isAdmitting ? 'Processing...' : 'Complete admission'}
        </Button>
      </form>
    </div>
  );
}
