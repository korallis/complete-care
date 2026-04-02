'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShiftPatternForm } from './shift-pattern-form';
import type { ShiftPattern } from '@/lib/db/schema/shift-patterns';
import type { ShiftPatternFormData } from '../lib/validation';

const DOMAIN_LABELS: Record<string, string> = {
  domiciliary_care: 'Domiciliary',
  supported_living: 'Supported Living',
  childrens_home: "Children's",
};

const TYPE_LABELS: Record<string, string> = {
  standard: 'Standard',
  sleep_in: 'Sleep-In',
  waking_night: 'Waking Night',
  on_call: 'On Call',
};

interface ShiftPatternListProps {
  patterns: ShiftPattern[];
  onCreatePattern: (data: ShiftPatternFormData) => void;
  onUpdatePattern: (id: string, data: ShiftPatternFormData) => void;
  onDeletePattern: (id: string) => void;
}

export function ShiftPatternList({
  patterns,
  onCreatePattern,
  onUpdatePattern,
  onDeletePattern,
}: ShiftPatternListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null);

  const groupedByDomain = patterns.reduce<Record<string, ShiftPattern[]>>((acc, p) => {
    const domain = p.careDomain;
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Shift Patterns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define shift templates for your care services
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Pattern
        </Button>
      </div>

      {/* Pattern list grouped by domain */}
      {Object.entries(groupedByDomain).map(([domain, domainPatterns]) => (
        <div key={domain} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {DOMAIN_LABELS[domain] ?? domain}
            </h3>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {domainPatterns.length} pattern{domainPatterns.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid gap-2">
            {domainPatterns.map((pattern) => (
              <Card
                key={pattern.id}
                className="group flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => {
                  setEditingPattern(pattern);
                  setFormOpen(true);
                }}
              >
                {/* Colour indicator */}
                <div
                  className="h-10 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: pattern.colour }}
                />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{pattern.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {TYPE_LABELS[pattern.shiftType] ?? pattern.shiftType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {pattern.startTime.slice(0, 5)} – {pattern.endTime.slice(0, 5)}
                    </span>
                    <span className="text-border">|</span>
                    <span className="tabular-nums">
                      {Math.floor(pattern.durationMinutes / 60)}h {pattern.durationMinutes % 60}m
                    </span>
                    {pattern.breakMinutes > 0 && (
                      <>
                        <span className="text-border">|</span>
                        <span>{pattern.breakMinutes}m break</span>
                      </>
                    )}
                    {pattern.rotaPattern && (
                      <>
                        <span className="text-border">|</span>
                        <span>{pattern.rotaPattern}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Pay rate */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium tabular-nums">
                    {pattern.payRateMultiplier}x
                  </div>
                  <div className="text-[11px] text-muted-foreground">rate</div>
                </div>

                {/* Min staff */}
                <div className="text-right shrink-0 w-12">
                  <div className="text-sm font-medium tabular-nums">
                    {pattern.minimumStaff}
                  </div>
                  <div className="text-[11px] text-muted-foreground">staff</div>
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePattern(pattern.id);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4m1.5 0l-.5 7.5a1 1 0 01-1 .5h-5a1 1 0 01-1-.5L3.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {patterns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
              <path d="M2 8h16M6 4v-2M14 4v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground" />
            </svg>
          </div>
          <p className="text-sm font-medium">No shift patterns defined</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create shift patterns to start building your rota
          </p>
        </div>
      )}

      {/* Form dialog */}
      <ShiftPatternForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingPattern(null);
        }}
        onSubmit={(data) => {
          if (editingPattern) {
            onUpdatePattern(editingPattern.id, data);
          } else {
            onCreatePattern(data);
          }
          setEditingPattern(null);
        }}
        initialData={
          editingPattern
            ? {
                name: editingPattern.name,
                careDomain: editingPattern.careDomain as ShiftPatternFormData['careDomain'],
                shiftType: editingPattern.shiftType as ShiftPatternFormData['shiftType'],
                startTime: editingPattern.startTime,
                endTime: editingPattern.endTime,
                isOvernight: editingPattern.isOvernight,
                breakMinutes: editingPattern.breakMinutes,
                payRateMultiplier: editingPattern.payRateMultiplier,
                colour: editingPattern.colour,
                minimumStaff: editingPattern.minimumStaff,
                requiredQualifications: editingPattern.requiredQualifications ?? [],
              }
            : undefined
        }
        isEditing={!!editingPattern}
      />
    </div>
  );
}
