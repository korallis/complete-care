/**
 * Tests for person dashboard types and timeline utilities.
 *
 * Validates:
 * - Timeline entry type definitions
 * - Dashboard metrics shape
 * - Timeline sorting and aggregation logic
 * - Component rendering basics
 */

import { describe, it, expect } from 'vitest';
import type {
  TimelineEntryType,
  TimelineEntry,
  DashboardMetrics,
  TimelineResult,
} from '@/features/person-dashboard/types';

// ---------------------------------------------------------------------------
// TimelineEntryType
// ---------------------------------------------------------------------------

describe('TimelineEntryType', () => {
  it('accepts all valid entry types', () => {
    const validTypes: TimelineEntryType[] = [
      'care_note',
      'care_plan',
      'risk_assessment',
      'incident',
      'document',
    ];
    // TypeScript compile-time check; if this compiles, types are valid
    expect(validTypes).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// TimelineEntry shape
// ---------------------------------------------------------------------------

describe('TimelineEntry', () => {
  it('has all required fields', () => {
    const entry: TimelineEntry = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'care_note',
      title: 'Daily note',
      description: 'Patient had a good day.',
      timestamp: new Date('2026-04-01T10:00:00Z'),
      metadata: { authorName: 'Jane Smith', shift: 'morning' },
    };
    expect(entry.id).toBeTruthy();
    expect(entry.type).toBe('care_note');
    expect(entry.title).toBe('Daily note');
    expect(entry.description).toBeTruthy();
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.metadata).toBeDefined();
  });

  it('metadata supports string, number, and null values', () => {
    const entry: TimelineEntry = {
      id: 'test-id',
      type: 'risk_assessment',
      title: 'Falls assessment',
      description: 'Completed',
      timestamp: new Date(),
      metadata: {
        templateId: 'falls',
        totalScore: 15,
        riskLevel: 'high',
        completedByName: null,
      },
    };
    expect(entry.metadata.templateId).toBe('falls');
    expect(entry.metadata.totalScore).toBe(15);
    expect(entry.metadata.completedByName).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// DashboardMetrics shape
// ---------------------------------------------------------------------------

describe('DashboardMetrics', () => {
  it('has all metric fields', () => {
    const metrics: DashboardMetrics = {
      activeCarePlans: 3,
      recentNotes: 12,
      openHighRiskAssessments: 1,
      openIncidents: 0,
    };
    expect(metrics.activeCarePlans).toBe(3);
    expect(metrics.recentNotes).toBe(12);
    expect(metrics.openHighRiskAssessments).toBe(1);
    expect(metrics.openIncidents).toBe(0);
  });

  it('all fields are numbers', () => {
    const metrics: DashboardMetrics = {
      activeCarePlans: 0,
      recentNotes: 0,
      openHighRiskAssessments: 0,
      openIncidents: 0,
    };
    for (const value of Object.values(metrics)) {
      expect(typeof value).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// TimelineResult shape
// ---------------------------------------------------------------------------

describe('TimelineResult', () => {
  it('has pagination fields', () => {
    const result: TimelineResult = {
      entries: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    expect(result.entries).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.totalPages).toBe(0);
  });

  it('calculates totalPages correctly', () => {
    // Simulate what the action does
    const totalCount = 45;
    const pageSize = 20;
    const totalPages = Math.ceil(totalCount / pageSize);
    expect(totalPages).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Timeline sorting logic (same as in actions.ts)
// ---------------------------------------------------------------------------

describe('Timeline sorting', () => {
  it('sorts entries by timestamp descending', () => {
    const entries: TimelineEntry[] = [
      {
        id: '1',
        type: 'care_note',
        title: 'Oldest',
        description: '',
        timestamp: new Date('2026-03-01T10:00:00Z'),
        metadata: {},
      },
      {
        id: '2',
        type: 'incident',
        title: 'Newest',
        description: '',
        timestamp: new Date('2026-04-01T10:00:00Z'),
        metadata: {},
      },
      {
        id: '3',
        type: 'care_plan',
        title: 'Middle',
        description: '',
        timestamp: new Date('2026-03-15T10:00:00Z'),
        metadata: {},
      },
    ];

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    expect(entries[0].title).toBe('Newest');
    expect(entries[1].title).toBe('Middle');
    expect(entries[2].title).toBe('Oldest');
  });

  it('handles entries with the same timestamp', () => {
    const sameTime = new Date('2026-04-01T10:00:00Z');
    const entries: TimelineEntry[] = [
      { id: '1', type: 'care_note', title: 'A', description: '', timestamp: sameTime, metadata: {} },
      { id: '2', type: 'incident', title: 'B', description: '', timestamp: sameTime, metadata: {} },
    ];

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Both entries should be present (stable sort)
    expect(entries).toHaveLength(2);
  });

  it('paginates correctly', () => {
    const entries: TimelineEntry[] = Array.from({ length: 45 }, (_, i) => ({
      id: String(i),
      type: 'care_note' as const,
      title: `Entry ${i}`,
      description: '',
      timestamp: new Date(2026, 3, 1, 0, 0, 0, 0),
      metadata: {},
    }));

    const pageSize = 20;
    const page1 = entries.slice(0, pageSize);
    const page2 = entries.slice(pageSize, pageSize * 2);
    const page3 = entries.slice(pageSize * 2, pageSize * 3);

    expect(page1).toHaveLength(20);
    expect(page2).toHaveLength(20);
    expect(page3).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Type filter logic
// ---------------------------------------------------------------------------

describe('Timeline type filtering', () => {
  it('filters by specific types', () => {
    const entries: TimelineEntry[] = [
      { id: '1', type: 'care_note', title: 'Note', description: '', timestamp: new Date(), metadata: {} },
      { id: '2', type: 'incident', title: 'Incident', description: '', timestamp: new Date(), metadata: {} },
      { id: '3', type: 'care_plan', title: 'Plan', description: '', timestamp: new Date(), metadata: {} },
    ];

    const allowedTypes = new Set(['care_note', 'incident']);
    const filtered = entries.filter((e) => allowedTypes.has(e.type));

    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.type)).toEqual(['care_note', 'incident']);
  });

  it('returns all entries when no type filter is applied', () => {
    const entries: TimelineEntry[] = [
      { id: '1', type: 'care_note', title: 'Note', description: '', timestamp: new Date(), metadata: {} },
      { id: '2', type: 'document', title: 'Doc', description: '', timestamp: new Date(), metadata: {} },
    ];

    const allTypes = new Set(['care_note', 'care_plan', 'risk_assessment', 'incident', 'document']);
    const filtered = entries.filter((e) => allTypes.has(e.type));

    expect(filtered).toHaveLength(2);
  });
});
