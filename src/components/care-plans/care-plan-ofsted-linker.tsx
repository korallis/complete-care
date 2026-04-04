'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type StandardOption = {
  id: string;
  name: string;
  regulationNumber: number;
};

type LinkedStandard = {
  standardId: string;
  standardName: string;
  regulationNumber: number;
};

interface CarePlanOfstedLinkerProps {
  canManage: boolean;
  standards: StandardOption[];
  linkedStandards: LinkedStandard[];
  onSave: (standardIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

export function CarePlanOfstedLinker({
  canManage,
  standards,
  linkedStandards,
  onSave,
}: CarePlanOfstedLinkerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    linkedStandards.map((row) => row.standardId),
  );
  const [isPending, startTransition] = useTransition();

  const linkedLookup = useMemo(
    () => new Set(linkedStandards.map((row) => row.standardId)),
    [linkedStandards],
  );

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSelectedIds(linkedStandards.map((row) => row.standardId));
    }
    setOpen(nextOpen);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await onSave(selectedIds);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to update linked standards');
        return;
      }

      toast.success('Quality standard links updated');
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
            Linked quality standards
          </h3>
          <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
            Show which Ofsted quality standards this care plan currently evidences.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Link to Quality Standard
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {linkedStandards.length > 0 ? (
          linkedStandards.map((row) => (
            <Badge key={row.standardId} variant="outline">
              Reg {row.regulationNumber}: {row.standardName}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-[oklch(0.65_0_0)] italic">
            No Ofsted quality standards linked yet.
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link to Quality Standard</DialogTitle>
            <DialogDescription>
              Choose one or more Ofsted quality standards that this care plan should evidence.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[26rem] space-y-3 overflow-y-auto">
            {standards.map((standard) => {
              const checked = selectedIds.includes(standard.id);
              return (
                <label
                  key={standard.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    checked
                      ? 'border-[oklch(0.35_0.06_160)] bg-[oklch(0.97_0.01_160)]'
                      : 'border-[oklch(0.9_0.003_160)] bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(standard.id)}
                    className="mt-1 h-4 w-4 rounded border-[oklch(0.75_0_0)]"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                      Regulation {standard.regulationNumber}
                    </p>
                    <p className="text-sm text-[oklch(0.45_0_0)]">
                      {standard.name}
                    </p>
                    {linkedLookup.has(standard.id) && (
                      <p className="text-xs text-[oklch(0.35_0.06_160)]">
                        Currently linked
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Saving...' : 'Save links'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
