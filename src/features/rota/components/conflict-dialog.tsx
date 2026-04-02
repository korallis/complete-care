'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Conflict } from '../lib/types';

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: Conflict[];
  staffName: string;
  onOverride: (conflictType: string, reason: string) => void;
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflicts,
  staffName,
  onOverride,
}: ConflictDialogProps) {
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);

  const errors = conflicts.filter((c) => c.severity === 'error');
  const warnings = conflicts.filter((c) => c.severity === 'warning');

  const handleOverride = () => {
    if (!selectedConflict || overrideReason.length < 10) return;
    onOverride(selectedConflict.type, overrideReason);
    setOverrideReason('');
    setSelectedConflict(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 1.5l7.794 13.5H1.206L9 1.5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="text-amber-500"
              />
              <path d="M9 7v3M9 12.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-amber-500" />
            </svg>
            Conflicts Detected — {staffName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Hard constraints (WTD) — cannot override */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span className="text-xs font-medium uppercase tracking-wider text-destructive">
                  Blocking — Cannot Override
                </span>
              </div>
              {errors.map((conflict, i) => (
                <div
                  key={i}
                  className="rounded-md border border-destructive/30 bg-destructive/5 p-3"
                >
                  <p className="text-sm">{conflict.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Working Time Directive violations must be resolved before rota confirmation.
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Overridable warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-amber-600">
                  Warnings — Can Override with Reason
                </span>
              </div>
              {warnings.map((conflict, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedConflict(conflict)}
                  className={`
                    w-full text-left rounded-md border p-3 transition-all
                    ${selectedConflict === conflict
                      ? 'border-foreground bg-muted/50'
                      : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                    }
                  `}
                >
                  <p className="text-sm">{conflict.message}</p>
                  {conflict.missingQualifications && (
                    <div className="flex gap-1 mt-2">
                      {conflict.missingQualifications.map((q) => (
                        <span
                          key={q}
                          className="inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Override reason input */}
          {selectedConflict && selectedConflict.overridable && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Override Reason (minimum 10 characters)
              </Label>
              <Input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this conflict is acceptable..."
                className="h-10"
              />
              <p className="text-[11px] text-muted-foreground">
                This reason will be recorded in the audit log for regulatory compliance.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedConflict?.overridable && (
            <Button
              onClick={handleOverride}
              disabled={overrideReason.length < 10}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Override & Assign
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
