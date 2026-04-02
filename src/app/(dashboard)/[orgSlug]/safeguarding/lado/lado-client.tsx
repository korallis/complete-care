'use client';

/**
 * LADO Referrals — Client Component
 *
 * Manages new referral form state and displays existing referrals.
 * Only visible to DSL / senior leadership (enforced in parent server component).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LadoReferralForm } from '@/features/safeguarding/components/lado-referral-form';
import { createLadoReferral } from '@/features/safeguarding/actions';
import type { LadoReferral } from '@/lib/db/schema/safeguarding';
import type { CreateLadoReferralInput } from '@/features/safeguarding/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LadoClientProps {
  referrals: LadoReferral[];
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-red-100 text-red-800 border-red-200' },
  investigating: { label: 'Investigating', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  concluded: { label: 'Concluded', className: 'bg-green-100 text-green-800 border-green-200' },
  no_action: { label: 'No Action', className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function LadoClient({ referrals }: LadoClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(data: CreateLadoReferralInput) {
    const result = await createLadoReferral(data);
    if (result.success) {
      toast.success('LADO referral created');
      setShowForm(false);
      router.refresh();
    } else {
      toast.error(result.error ?? 'Failed to create LADO referral');
    }
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {referrals.length} referral{referrals.length !== 1 ? 's' : ''} recorded
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
              <Plus className="h-4 w-4" /> New LADO Referral
            </>
          )}
        </Button>
      </div>

      {/* New referral form */}
      {showForm && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/30 p-4">
          <LadoReferralForm
            childId=""
            childName=""
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Referrals list */}
      {referrals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            No LADO referrals recorded
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            LADO referrals are raised when there is an allegation against a member of staff.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((referral) => {
            const statusStyle = STATUS_STYLES[referral.status] ?? STATUS_STYLES.open;
            return (
              <div
                key={referral.id}
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
                      <span className="text-xs text-muted-foreground font-mono">
                        {referral.ladoReference ?? 'No reference yet'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] line-clamp-2">
                      Allegation against: {referral.allegationAgainstStaffName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {referral.allegationDetails}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.referralDate).toLocaleDateString('en-GB', {
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
