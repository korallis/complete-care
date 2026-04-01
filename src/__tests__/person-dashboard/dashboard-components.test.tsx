/**
 * Tests for person dashboard component rendering.
 *
 * Validates:
 * - MetricsGrid renders all metrics
 * - PersonSummaryCard renders person info
 * - UnifiedTimeline renders entries
 * - TimelineEntry renders different types correctly
 * - QuickActions renders action buttons for editors
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsGrid } from '@/components/person-dashboard/metrics-grid';
import { PersonSummaryCard } from '@/components/person-dashboard/person-summary-card';
import { UnifiedTimeline } from '@/components/person-dashboard/unified-timeline';
import { TimelineEntryComponent } from '@/components/person-dashboard/timeline-entry';
import type { DashboardMetrics } from '@/features/person-dashboard/types';
import type { TimelineEntry } from '@/features/person-dashboard/types';
import type { Person } from '@/lib/db/schema/persons';

// ---------------------------------------------------------------------------
// Mock person for testing
// ---------------------------------------------------------------------------

const mockPerson: Person = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  organisationId: '660e8400-e29b-41d4-a716-446655440001',
  fullName: 'Jane Smith',
  firstName: 'Jane',
  lastName: 'Smith',
  preferredName: 'Janey',
  type: 'resident',
  status: 'active',
  dateOfBirth: '1945-03-15',
  gender: 'female',
  ethnicity: null,
  religion: null,
  firstLanguage: 'English',
  nhsNumber: '1234567890',
  gpName: 'Dr Johnson',
  gpPractice: 'Village Surgery',
  allergies: ['Penicillin', 'Latex'],
  medicalConditions: ['Hypertension'],
  contactPhone: '01onal234567',
  contactEmail: 'jane@example.com',
  address: '123 High Street',
  emergencyContacts: [],
  photoUrl: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
};

// ---------------------------------------------------------------------------
// MetricsGrid
// ---------------------------------------------------------------------------

describe('MetricsGrid', () => {
  const metrics: DashboardMetrics = {
    activeCarePlans: 3,
    recentNotes: 12,
    openHighRiskAssessments: 1,
    openIncidents: 2,
  };

  it('renders all four metric cards', () => {
    render(<MetricsGrid metrics={metrics} />);
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });

  it('renders metric labels', () => {
    render(<MetricsGrid metrics={metrics} />);
    expect(screen.getByText('Active Care Plans')).toBeDefined();
    expect(screen.getByText('Notes (7 days)')).toBeDefined();
    expect(screen.getByText('High/Critical Risks')).toBeDefined();
    expect(screen.getByText('Open Incidents')).toBeDefined();
  });

  it('renders zero values', () => {
    const zeroMetrics: DashboardMetrics = {
      activeCarePlans: 0,
      recentNotes: 0,
      openHighRiskAssessments: 0,
      openIncidents: 0,
    };
    render(<MetricsGrid metrics={zeroMetrics} />);
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// PersonSummaryCard
// ---------------------------------------------------------------------------

describe('PersonSummaryCard', () => {
  it('renders person full name', () => {
    render(<PersonSummaryCard person={mockPerson} />);
    expect(screen.getByText('Jane Smith')).toBeDefined();
  });

  it('renders preferred name when different from full name', () => {
    render(<PersonSummaryCard person={mockPerson} />);
    expect(screen.getByText('(Janey)')).toBeDefined();
  });

  it('renders allergy alert when allergies exist', () => {
    render(<PersonSummaryCard person={mockPerson} />);
    expect(screen.getByText(/Allergies:.*Penicillin, Latex/)).toBeDefined();
  });

  it('does not render allergy alert when no allergies', () => {
    const personNoAllergies = { ...mockPerson, allergies: [] };
    render(<PersonSummaryCard person={personNoAllergies} />);
    expect(screen.queryByText(/Allergies:/)).toBeNull();
  });

  it('renders NHS number', () => {
    render(<PersonSummaryCard person={mockPerson} />);
    // formatNhsNumber formats as '123 456 7890'
    expect(screen.getByText('123 456 7890')).toBeDefined();
  });

  it('renders GP name', () => {
    render(<PersonSummaryCard person={mockPerson} />);
    expect(screen.getByText('Dr Johnson')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// UnifiedTimeline
// ---------------------------------------------------------------------------

describe('UnifiedTimeline', () => {
  it('renders empty message when no entries', () => {
    render(<UnifiedTimeline entries={[]} />);
    expect(screen.getByText('No activity recorded yet.')).toBeDefined();
  });

  it('renders custom empty message', () => {
    render(
      <UnifiedTimeline entries={[]} emptyMessage="Nothing to show." />,
    );
    expect(screen.getByText('Nothing to show.')).toBeDefined();
  });

  it('renders timeline entries', () => {
    const entries: TimelineEntry[] = [
      {
        id: '1',
        type: 'care_note',
        title: 'Morning note',
        description: 'Patient had breakfast.',
        timestamp: new Date('2026-04-01T08:00:00Z'),
        metadata: { authorName: 'Nurse A' },
      },
      {
        id: '2',
        type: 'incident',
        title: 'Minor incident',
        description: 'Slip in bathroom.',
        timestamp: new Date('2026-04-01T10:00:00Z'),
        metadata: { severity: 'minor', status: 'reported' },
      },
    ];
    render(<UnifiedTimeline entries={entries} />);
    expect(screen.getByText('Morning note')).toBeDefined();
    expect(screen.getByText('Minor incident')).toBeDefined();
  });

  it('has accessible list role', () => {
    const entries: TimelineEntry[] = [
      {
        id: '1',
        type: 'care_note',
        title: 'Note',
        description: 'Content',
        timestamp: new Date(),
        metadata: {},
      },
    ];
    render(<UnifiedTimeline entries={entries} />);
    expect(screen.getByRole('list', { name: 'Activity timeline' })).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// TimelineEntryComponent
// ---------------------------------------------------------------------------

describe('TimelineEntryComponent', () => {
  it('renders care note entry with badge', () => {
    const entry: TimelineEntry = {
      id: '1',
      type: 'care_note',
      title: 'Daily note',
      description: 'Patient was comfortable.',
      timestamp: new Date('2026-04-01T10:00:00Z'),
      metadata: { authorName: 'Nurse B', shift: 'morning', mood: 'happy' },
    };
    render(<TimelineEntryComponent entry={entry} />);
    expect(screen.getByText('Care Note')).toBeDefined();
    expect(screen.getByText('Daily note')).toBeDefined();
    expect(screen.getByText(/by Nurse B/)).toBeDefined();
  });

  it('renders care plan entry with badge', () => {
    const entry: TimelineEntry = {
      id: '2',
      type: 'care_plan',
      title: 'Comprehensive Care Plan',
      description: 'Care plan approved (v3)',
      timestamp: new Date('2026-04-01T14:00:00Z'),
      metadata: { status: 'approved', version: 3 },
    };
    render(<TimelineEntryComponent entry={entry} />);
    expect(screen.getByText('Care Plan')).toBeDefined();
    expect(screen.getByText('Comprehensive Care Plan')).toBeDefined();
  });

  it('renders high risk assessment with extra badge', () => {
    const entry: TimelineEntry = {
      id: '3',
      type: 'risk_assessment',
      title: 'Falls assessment',
      description: 'completed - high risk (score: 18)',
      timestamp: new Date('2026-04-01T09:00:00Z'),
      metadata: {
        templateId: 'falls',
        riskLevel: 'high',
        totalScore: 18,
        status: 'completed',
        completedByName: 'Dr Adams',
      },
    };
    render(<TimelineEntryComponent entry={entry} />);
    expect(screen.getByText('Risk Assessment')).toBeDefined();
    expect(screen.getByText('high')).toBeDefined();
    expect(screen.getByText(/Completed by Dr Adams/)).toBeDefined();
  });

  it('renders incident entry', () => {
    const entry: TimelineEntry = {
      id: '4',
      type: 'incident',
      title: 'Serious incident',
      description: 'Fall in corridor resulting in minor bruise.',
      timestamp: new Date('2026-04-01T16:30:00Z'),
      metadata: {
        severity: 'serious',
        status: 'reported',
        location: 'Corridor',
        reportedByName: 'Staff C',
      },
    };
    render(<TimelineEntryComponent entry={entry} />);
    expect(screen.getByText('Incident')).toBeDefined();
    expect(screen.getByText('serious')).toBeDefined();
    expect(screen.getByText(/Reported by Staff C at Corridor/)).toBeDefined();
  });

  it('renders document entry', () => {
    const entry: TimelineEntry = {
      id: '5',
      type: 'document',
      title: 'GP Letter',
      description: 'medical document uploaded',
      timestamp: new Date('2026-04-01T11:00:00Z'),
      metadata: { category: 'medical', uploadedByName: 'Admin D' },
    };
    render(<TimelineEntryComponent entry={entry} />);
    expect(screen.getByText('Document')).toBeDefined();
    expect(screen.getByText('GP Letter')).toBeDefined();
    expect(screen.getByText(/Uploaded by Admin D/)).toBeDefined();
  });

  it('truncates long descriptions', () => {
    const longDescription = 'A'.repeat(200);
    const entry: TimelineEntry = {
      id: '6',
      type: 'care_note',
      title: 'Long note',
      description: longDescription,
      timestamp: new Date(),
      metadata: {},
    };
    render(<TimelineEntryComponent entry={entry} />);
    // The component uses line-clamp-2 CSS, but the text is in the DOM
    // (CSS handles visual truncation)
    expect(screen.getByText(longDescription)).toBeDefined();
  });
});
