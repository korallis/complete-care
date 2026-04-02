'use client';

/**
 * Section 47 Investigations — Client Component
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Section47Form } from '@/features/safeguarding/components/section47-form';
import { createSection47 } from '@/features/safeguarding/actions';
import type { Section47Investigation } from '@/lib/db/schema/safeguarding';
import type { CreateSection47Input } from '@/features/safeguarding/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section47ClientProps {
  investigations: Section47Investigation[];
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-red-100 text-red-800 border-red-200' },
  strategy_meeting_held: { label: 'Strategy Meeting Held', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  investigation_ongoing: { label: 'Ongoing', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  concluded: { label: 'Concluded', className: 'bg-green-100 text-green-800 border-green-200' },
  no_further_action: { label: 'No Further Action', className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function Section47Client({ investigations }: Section47ClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(data: CreateSection47Input) {
    const result = await createSection47(data);
    if (result.success) {
      toast.success('Section 47 investigation recorded');
      setShowForm(false);
      router.refresh();
    } else {
      toast.error(result.error ?? 'Failed to record investigation');
    }
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {investigations.length} investigation{investigations.length !== 1 ? 's' : ''} recorded
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'outline' : 'default'}
          className="flex items-center gap-1.5"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Record Investigation
            </>
          )}
        </Button>
      </div>

      {/* New investigation form */}
      {showForm && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4">
          <Section47Form
            childId=""
            childName=""
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Investigations list */}
      {investigations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            No Section 47 investigations recorded
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Section 47 enquiries are initiated when children&apos;s social care has reasonable cause
            to suspect a child may be suffering, or is likely to suffer, significant harm.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {investigations.map((inv) => {
            const statusStyle = STATUS_STYLES[inv.status] ?? STATUS_STYLES.open;
            return (
              <div
                key={inv.id}
                className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-medium', statusStyle.className)}
                      >
                        {statusStyle.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] line-clamp-2">
                      {inv.notes ?? inv.strategyMeetingDecisions ?? `Child ID: ${inv.childId}`}
                    </p>
                    {inv.strategyMeetingDate && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Strategy meeting:{' '}
                        {new Date(inv.strategyMeetingDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                    {inv.outcome && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Outcome: {inv.outcome}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
