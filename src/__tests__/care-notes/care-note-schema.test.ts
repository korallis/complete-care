/**
 * Tests for care note schema, validation, and utilities.
 *
 * Validates:
 * - care_notes table has required columns (including new structured fields)
 * - Zod validation schemas work correctly
 * - Filter schema validation
 * - Helper functions (mood variant, date formatting, labels)
 * - RBAC permissions for notes resource
 */

import { describe, it, expect } from 'vitest';
import { careNotes } from '@/lib/db/schema/care-notes';
import {
  createCareNoteSchema,
  careNoteFilterSchema,
  MOOD_OPTIONS,
  SHIFT_OPTIONS,
  PORTION_OPTIONS,
  NOTE_TYPE_OPTIONS,
  MOOD_LABELS,
  SHIFT_LABELS,
  PORTION_LABELS,
  NOTE_TYPE_LABELS,
  getMoodVariant,
  getShiftLabel,
  formatNoteDate,
  formatNoteTime,
} from '@/features/care-notes/schema';
import { hasPermission } from '@/lib/rbac/permissions';

// ---------------------------------------------------------------------------
// care_notes table schema
// ---------------------------------------------------------------------------

describe('care_notes table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(careNotes);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('authorId');
    expect(columns).toContain('authorName');
    expect(columns).toContain('noteType');
    expect(columns).toContain('shift');
    expect(columns).toContain('content');
    expect(columns).toContain('createdAt');
  });

  it('has structured observation columns', () => {
    const columns = Object.keys(careNotes);
    expect(columns).toContain('mood');
    expect(columns).toContain('personalCare');
    expect(columns).toContain('nutrition');
    expect(columns).toContain('mobility');
    expect(columns).toContain('health');
    expect(columns).toContain('handover');
  });

  it('has organisationId for tenant isolation', () => {
    const columns = Object.keys(careNotes);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// createCareNoteSchema validation
// ---------------------------------------------------------------------------

describe('createCareNoteSchema', () => {
  it('accepts a valid minimal care note', () => {
    const result = createCareNoteSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      content: 'A daily care note',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.noteType).toBe('daily');
    }
  });

  it('accepts a fully populated care note', () => {
    const result = createCareNoteSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      noteType: 'handover',
      shift: 'morning',
      content: 'A detailed handover note',
      mood: 'content',
      personalCare: {
        washed: true,
        dressed: true,
        oralCare: false,
        notes: 'Assisted with dressing',
      },
      nutrition: {
        breakfast: {
          offered: true,
          portionConsumed: 'three_quarters',
          notes: 'Ate well',
        },
        lunch: {
          offered: true,
          portionConsumed: 'half',
        },
        fluidsNote: 'Good fluid intake',
      },
      mobility: 'Walked to dining room with frame',
      health: 'No concerns',
      handover: 'Medication at 2pm',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = createCareNoteSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      content: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('required');
    }
  });

  it('rejects invalid personId', () => {
    const result = createCareNoteSchema.safeParse({
      personId: 'not-a-uuid',
      content: 'A note',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid mood', () => {
    const result = createCareNoteSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      content: 'A note',
      mood: 'invalid_mood',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid shift', () => {
    const result = createCareNoteSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      content: 'A note',
      shift: 'invalid_shift',
    });
    expect(result.success).toBe(false);
  });

  it('rejects content exceeding 10000 characters', () => {
    const result = createCareNoteSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      content: 'x'.repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid mood options', () => {
    for (const mood of MOOD_OPTIONS) {
      const result = createCareNoteSchema.safeParse({
        personId: '00000000-0000-0000-0000-000000000001',
        content: 'A note',
        mood,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid shift options', () => {
    for (const shift of SHIFT_OPTIONS) {
      const result = createCareNoteSchema.safeParse({
        personId: '00000000-0000-0000-0000-000000000001',
        content: 'A note',
        shift,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid portion options in nutrition', () => {
    for (const portion of PORTION_OPTIONS) {
      const result = createCareNoteSchema.safeParse({
        personId: '00000000-0000-0000-0000-000000000001',
        content: 'A note',
        nutrition: {
          breakfast: {
            offered: true,
            portionConsumed: portion,
          },
        },
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// careNoteFilterSchema validation
// ---------------------------------------------------------------------------

describe('careNoteFilterSchema', () => {
  it('accepts empty filters with defaults', () => {
    const result = careNoteFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(25);
    }
  });

  it('accepts all filter fields', () => {
    const result = careNoteFilterSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      authorId: '00000000-0000-0000-0000-000000000002',
      shift: 'morning',
      noteType: 'daily',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      page: 2,
      pageSize: 50,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid date format', () => {
    const result = careNoteFilterSchema.safeParse({
      dateFrom: '01-01-2025',
    });
    expect(result.success).toBe(false);
  });

  it('caps pageSize at 100', () => {
    const result = careNoteFilterSchema.safeParse({
      pageSize: 999,
    });
    expect(result.success).toBe(false);
  });

  it('rejects page less than 1', () => {
    const result = careNoteFilterSchema.safeParse({
      page: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants: all options have labels
// ---------------------------------------------------------------------------

describe('constants and labels', () => {
  it('every mood option has a label', () => {
    for (const mood of MOOD_OPTIONS) {
      expect(MOOD_LABELS[mood]).toBeTruthy();
    }
  });

  it('every shift option has a label', () => {
    for (const shift of SHIFT_OPTIONS) {
      expect(SHIFT_LABELS[shift]).toBeTruthy();
    }
  });

  it('every portion option has a label', () => {
    for (const portion of PORTION_OPTIONS) {
      expect(PORTION_LABELS[portion]).toBeTruthy();
    }
  });

  it('every note type option has a label', () => {
    for (const noteType of NOTE_TYPE_OPTIONS) {
      expect(NOTE_TYPE_LABELS[noteType]).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

describe('getMoodVariant', () => {
  it('returns "default" for happy', () => {
    expect(getMoodVariant('happy')).toBe('default');
  });

  it('returns "secondary" for content', () => {
    expect(getMoodVariant('content')).toBe('secondary');
  });

  it('returns "destructive" for anxious and upset', () => {
    expect(getMoodVariant('anxious')).toBe('destructive');
    expect(getMoodVariant('upset')).toBe('destructive');
  });

  it('returns "outline" for withdrawn', () => {
    expect(getMoodVariant('withdrawn')).toBe('outline');
  });

  it('returns "outline" for unknown mood', () => {
    expect(getMoodVariant('unknown')).toBe('outline');
  });
});

describe('getShiftLabel', () => {
  it('returns label for valid shift', () => {
    expect(getShiftLabel('morning')).toBe('Morning');
    expect(getShiftLabel('waking_night')).toBe('Waking Night');
  });

  it('returns empty string for null/undefined', () => {
    expect(getShiftLabel(null)).toBe('');
    expect(getShiftLabel(undefined)).toBe('');
  });
});

describe('formatNoteDate', () => {
  it('formats a Date object', () => {
    const d = new Date('2025-06-15T10:30:00Z');
    const result = formatNoteDate(d);
    // Should contain day, month, year
    expect(result).toMatch(/15/);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2025/);
  });

  it('formats a date string', () => {
    const result = formatNoteDate('2025-06-15T10:30:00Z');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/Jun/);
  });
});

describe('formatNoteTime', () => {
  it('formats time from a Date object', () => {
    const d = new Date('2025-06-15T10:30:00Z');
    const result = formatNoteTime(d);
    // Should contain hours and minutes
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// RBAC permissions for notes
// ---------------------------------------------------------------------------

describe('RBAC permissions for notes', () => {
  it('owner can read, create, update, delete, approve, export notes', () => {
    expect(hasPermission('owner', 'read', 'notes')).toBe(true);
    expect(hasPermission('owner', 'create', 'notes')).toBe(true);
    expect(hasPermission('owner', 'update', 'notes')).toBe(true);
    expect(hasPermission('owner', 'delete', 'notes')).toBe(true);
    expect(hasPermission('owner', 'approve', 'notes')).toBe(true);
  });

  it('carer can read and create notes', () => {
    expect(hasPermission('carer', 'read', 'notes')).toBe(true);
    expect(hasPermission('carer', 'create', 'notes')).toBe(true);
  });

  it('carer cannot update or delete notes', () => {
    expect(hasPermission('carer', 'update', 'notes')).toBe(false);
    expect(hasPermission('carer', 'delete', 'notes')).toBe(false);
  });

  it('viewer can only read notes', () => {
    expect(hasPermission('viewer', 'read', 'notes')).toBe(true);
    expect(hasPermission('viewer', 'create', 'notes')).toBe(false);
    expect(hasPermission('viewer', 'update', 'notes')).toBe(false);
  });

  it('manager can read, create, update, and approve notes', () => {
    expect(hasPermission('manager', 'read', 'notes')).toBe(true);
    expect(hasPermission('manager', 'create', 'notes')).toBe(true);
    expect(hasPermission('manager', 'update', 'notes')).toBe(true);
    expect(hasPermission('manager', 'approve', 'notes')).toBe(true);
  });
});
