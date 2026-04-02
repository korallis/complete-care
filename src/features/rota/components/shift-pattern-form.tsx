'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { CareDomain, ShiftType } from '../lib/types';
import { createShiftPatternSchema, type ShiftPatternFormData } from '../lib/validation';
import { calculateDurationMinutes } from '../lib/wtd-checks';

const CARE_DOMAINS: { value: CareDomain; label: string }[] = [
  { value: 'domiciliary_care', label: 'Domiciliary Care' },
  { value: 'supported_living', label: 'Supported Living' },
  { value: 'childrens_home', label: "Children's Home" },
];

const SHIFT_TYPES: { value: ShiftType; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard', description: 'Regular shift' },
  { value: 'sleep_in', label: 'Sleep-In', description: 'Overnight with sleep period' },
  { value: 'waking_night', label: 'Waking Night', description: 'Active overnight shift' },
  { value: 'on_call', label: 'On Call', description: 'Available if needed' },
];

const ROTA_PATTERNS = [
  { value: '2on2off', label: '2 on / 2 off' },
  { value: '4on4off', label: '4 on / 4 off' },
  { value: '5on2off', label: '5 on / 2 off' },
  { value: 'custom', label: 'Custom pattern' },
];

const PRESET_COLOURS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#6366F1', // indigo
  '#F97316', // orange
  '#14B8A6', // teal
  '#A855F7', // purple
];

interface ShiftPatternFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ShiftPatternFormData) => void;
  initialData?: Partial<ShiftPatternFormData>;
  isEditing?: boolean;
}

export function ShiftPatternForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: ShiftPatternFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<ShiftPatternFormData>>({
    name: '',
    careDomain: 'supported_living',
    shiftType: 'standard',
    startTime: '07:00',
    endTime: '19:00',
    isOvernight: false,
    breakMinutes: 30,
    payRateMultiplier: '1.00',
    colour: '#3B82F6',
    minimumStaff: 1,
    requiredQualifications: [],
    ...initialData,
  });

  const updateField = <K extends keyof ShiftPatternFormData>(
    key: K,
    value: ShiftPatternFormData[K],
  ) => {
    setFormData((prev: Partial<ShiftPatternFormData>) => ({ ...prev, [key]: value }));
    setErrors((prev: Record<string, string>) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const duration = formData.startTime && formData.endTime
    ? calculateDurationMinutes(
        formData.startTime,
        formData.endTime,
        formData.isOvernight ?? false,
      )
    : 0;

  const paidMinutes = Math.max(0, duration - (formData.breakMinutes ?? 0));

  const handleSubmit = () => {
    const result = createShiftPatternSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const path = e.path.join('.');
        fieldErrors[path] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onSubmit(result.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {isEditing ? 'Edit Shift Pattern' : 'New Shift Pattern'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name and Domain */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pattern Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Early Morning Run"
                value={formData.name ?? ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="h-10"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Care Domain
              </Label>
              <Select
                value={formData.careDomain ?? ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('careDomain', e.target.value as CareDomain)}
                className="h-10"
              >
                {CARE_DOMAINS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Shift Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Shift Type
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {SHIFT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => updateField('shiftType', t.value)}
                  className={`
                    rounded-md border px-3 py-2.5 text-left transition-all
                    ${formData.shiftType === t.value
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background hover:border-foreground/30'
                    }
                  `}
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className={`text-[11px] mt-0.5 ${
                    formData.shiftType === t.value ? 'text-background/70' : 'text-muted-foreground'
                  }`}>
                    {t.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime ?? '07:00'}
                onChange={(e) => updateField('startTime', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime ?? '19:00'}
                onChange={(e) => updateField('endTime', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Duration
              </Label>
              <div className="flex h-10 items-center rounded-md border border-border bg-muted px-3">
                <span className="text-sm font-medium tabular-nums">
                  {Math.floor(duration / 60)}h {duration % 60}m
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  ({Math.floor(paidMinutes / 60)}h {paidMinutes % 60}m paid)
                </span>
              </div>
            </div>
          </div>

          {/* Overnight toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              role="checkbox"
              aria-checked={formData.isOvernight}
              onClick={() => updateField('isOvernight', !formData.isOvernight)}
              className={`
                relative h-5 w-9 rounded-full transition-colors cursor-pointer
                ${formData.isOvernight ? 'bg-foreground' : 'bg-border'}
              `}
            >
              <div className={`
                absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform
                ${formData.isOvernight ? 'translate-x-4' : 'translate-x-0.5'}
              `} />
            </div>
            <span className="text-sm">Overnight shift (crosses midnight)</span>
          </label>

          {/* Break and Pay */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breakMinutes" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Break (minutes)
              </Label>
              <Input
                id="breakMinutes"
                type="number"
                min={0}
                max={120}
                value={formData.breakMinutes ?? 0}
                onChange={(e) => updateField('breakMinutes', parseInt(e.target.value) || 0)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payRate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pay Rate Multiplier
              </Label>
              <Input
                id="payRate"
                value={formData.payRateMultiplier ?? '1.00'}
                onChange={(e) => updateField('payRateMultiplier', e.target.value)}
                placeholder="1.00"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStaff" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Minimum Staff
              </Label>
              <Input
                id="minStaff"
                type="number"
                min={1}
                value={formData.minimumStaff ?? 1}
                onChange={(e) => updateField('minimumStaff', parseInt(e.target.value) || 1)}
                className="h-10"
              />
            </div>
          </div>

          {/* Sleep-in config (conditional) */}
          {formData.shiftType === 'sleep_in' && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-sm font-medium">Sleep-In Configuration</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Sleep Start
                  </Label>
                  <Input
                    type="time"
                    value={formData.sleepInConfig?.sleepInStart ?? '22:00'}
                    onChange={(e) =>
                      updateField('sleepInConfig', {
                        sleepInStart: e.target.value,
                        sleepInEnd: formData.sleepInConfig?.sleepInEnd ?? '07:00',
                        flatRate: formData.sleepInConfig?.flatRate ?? 40,
                        enhancedRateIfDisturbed: formData.sleepInConfig?.enhancedRateIfDisturbed ?? 12,
                      })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Sleep End
                  </Label>
                  <Input
                    type="time"
                    value={formData.sleepInConfig?.sleepInEnd ?? '07:00'}
                    onChange={(e) =>
                      updateField('sleepInConfig', {
                        ...formData.sleepInConfig!,
                        sleepInEnd: e.target.value,
                      })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Flat Rate (GBP)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.sleepInConfig?.flatRate ?? 40}
                    onChange={(e) =>
                      updateField('sleepInConfig', {
                        ...formData.sleepInConfig!,
                        flatRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Enhanced /hr
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={formData.sleepInConfig?.enhancedRateIfDisturbed ?? 12}
                    onChange={(e) =>
                      updateField('sleepInConfig', {
                        ...formData.sleepInConfig!,
                        enhancedRateIfDisturbed: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rota Pattern */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Rota Pattern (optional)
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateField('rotaPattern', null)}
                className={`
                  rounded-full px-3 py-1.5 text-xs font-medium border transition-all
                  ${!formData.rotaPattern
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:border-foreground/30'
                  }
                `}
              >
                None
              </button>
              {ROTA_PATTERNS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateField('rotaPattern', p.value as ShiftPatternFormData['rotaPattern'])}
                  className={`
                    rounded-full px-3 py-1.5 text-xs font-medium border transition-all
                    ${formData.rotaPattern === p.value
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/30'
                    }
                  `}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colour */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Display Colour
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateField('colour', c)}
                  className={`
                    h-8 w-8 rounded-md transition-all
                    ${formData.colour === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}
                  `}
                  style={{ backgroundColor: c }}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
          </div>

          {/* WTD info */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-foreground/40 flex items-center justify-center">
                <span className="text-[9px] font-bold">i</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Working Time Directive:</span>{' '}
                Shifts are validated against WTD rules. Maximum 48 hours per week average.
                Minimum 11 hours rest between consecutive shifts. WTD violations block rota confirmation.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Save Changes' : 'Create Pattern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
