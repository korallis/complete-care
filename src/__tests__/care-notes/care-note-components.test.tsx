/**
 * Tests for care note UI components.
 *
 * Validates:
 * - CareNoteCard renders note content and structured data
 * - CareNoteCard displays author, date, shift, mood badges
 * - CareNoteTimeline renders empty state and note list
 * - CareNoteTimeline shows filter controls
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/test-org/persons/person-1/care-notes'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock auth/db for server action imports
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import { CareNoteCard } from '@/components/care-notes/care-note-card';
import { CareNoteTimeline } from '@/components/care-notes/care-note-timeline';
import type { CareNoteListItem, CareNoteListResult } from '@/features/care-notes/actions';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockNote: CareNoteListItem = {
  id: 'note-1',
  personId: 'person-1',
  authorId: 'user-1',
  authorName: 'Jane Smith',
  noteType: 'daily',
  shift: 'morning',
  content: 'Had a good morning. Ate breakfast well and went for a walk.',
  mood: 'happy',
  personalCare: {
    washed: true,
    dressed: true,
    oralCare: true,
    notes: 'Assisted with dressing',
  },
  nutrition: {
    breakfast: {
      offered: true,
      portionConsumed: 'three_quarters',
      notes: 'Enjoyed porridge',
    },
    lunch: {
      offered: true,
      portionConsumed: 'half',
    },
  },
  mobility: 'Walked to the garden with frame assistance',
  health: 'Blood pressure normal',
  handover: 'Medication at 2pm',
  createdAt: new Date('2025-06-15T09:30:00Z'),
};

const mockMinimalNote: CareNoteListItem = {
  id: 'note-2',
  personId: 'person-1',
  authorId: 'user-2',
  authorName: 'John Doe',
  noteType: 'daily',
  shift: null,
  content: 'Quiet afternoon.',
  mood: null,
  personalCare: null,
  nutrition: null,
  mobility: null,
  health: null,
  handover: null,
  createdAt: new Date('2025-06-15T14:00:00Z'),
};

// ---------------------------------------------------------------------------
// CareNoteCard
// ---------------------------------------------------------------------------

describe('CareNoteCard', () => {
  it('renders note content', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(
      screen.getByText(/Had a good morning/),
    ).toBeTruthy();
  });

  it('renders author name', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(screen.getByText('Jane Smith')).toBeTruthy();
  });

  it('renders mood badge for happy mood', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(screen.getByText('Happy')).toBeTruthy();
  });

  it('renders shift badge', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(screen.getByText('Morning')).toBeTruthy();
  });

  it('renders personal care section when present', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(screen.getByText('Personal Care')).toBeTruthy();
    expect(screen.getByText('Assisted with dressing')).toBeTruthy();
  });

  it('renders nutrition section when present', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(screen.getByText('Nutrition')).toBeTruthy();
    expect(screen.getByText(/Enjoyed porridge/)).toBeTruthy();
  });

  it('renders mobility when present', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(screen.getByText('Mobility')).toBeTruthy();
    expect(screen.getByText(/Walked to the garden/)).toBeTruthy();
  });

  it('renders health when present', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(screen.getByText('Health Observations')).toBeTruthy();
    expect(screen.getByText('Blood pressure normal')).toBeTruthy();
  });

  it('renders handover when present', () => {
    render(<CareNoteCard note={mockNote} />);
    expect(screen.getByText('Handover Points')).toBeTruthy();
    expect(screen.getByText('Medication at 2pm')).toBeTruthy();
  });

  it('does not render structured sections for minimal note', () => {
    render(<CareNoteCard note={mockMinimalNote} />);
    expect(screen.queryByText('Personal Care')).toBeNull();
    expect(screen.queryByText('Nutrition')).toBeNull();
    expect(screen.queryByText('Mobility')).toBeNull();
    expect(screen.queryByText('Health Observations')).toBeNull();
    expect(screen.queryByText('Handover Points')).toBeNull();
  });

  it('renders "Unknown author" when authorName is null', () => {
    const noteWithoutAuthor = { ...mockMinimalNote, authorName: null };
    render(<CareNoteCard note={noteWithoutAuthor} />);
    expect(screen.getByText('Unknown author')).toBeTruthy();
  });

  it('has accessible article role with label', () => {
    const { container } = render(<CareNoteCard note={mockNote} />);
    const article = container.querySelector('article');
    expect(article).toBeTruthy();
    expect(article?.getAttribute('aria-label')).toContain('Jane Smith');
  });
});

// ---------------------------------------------------------------------------
// CareNoteTimeline
// ---------------------------------------------------------------------------

describe('CareNoteTimeline', () => {
  const emptyResult: CareNoteListResult = {
    notes: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
    totalPages: 0,
  };

  const populatedResult: CareNoteListResult = {
    notes: [mockNote, mockMinimalNote],
    totalCount: 2,
    page: 1,
    pageSize: 25,
    totalPages: 1,
  };

  const mockFilter = vi.fn().mockResolvedValue(emptyResult);

  it('renders empty state when no notes', () => {
    render(
      <CareNoteTimeline
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('No care notes found.')).toBeTruthy();
  });

  it('renders "Create the first note" link in empty state when canCreate', () => {
    render(
      <CareNoteTimeline
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('Create the first note')).toBeTruthy();
  });

  it('does not show create link in empty state when canCreate is false', () => {
    render(
      <CareNoteTimeline
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={false}
        onFilter={mockFilter}
      />,
    );
    expect(screen.queryByText('Create the first note')).toBeNull();
  });

  it('renders note cards when data is present', () => {
    render(
      <CareNoteTimeline
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('Jane Smith')).toBeTruthy();
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('shows total count', () => {
    render(
      <CareNoteTimeline
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('2 notes recorded')).toBeTruthy();
  });

  it('shows "Add Note" button when canCreate is true', () => {
    render(
      <CareNoteTimeline
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('Add Note')).toBeTruthy();
  });

  it('hides "Add Note" button when canCreate is false', () => {
    render(
      <CareNoteTimeline
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={false}
        onFilter={mockFilter}
      />,
    );
    expect(screen.queryByText('Add Note')).toBeNull();
  });

  it('renders filter controls', () => {
    render(
      <CareNoteTimeline
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    // Check filter labels exist
    expect(screen.getByLabelText('Shift')).toBeTruthy();
    expect(screen.getByLabelText('Category')).toBeTruthy();
    expect(screen.getByLabelText('From')).toBeTruthy();
    expect(screen.getByLabelText('To')).toBeTruthy();
  });

  it('renders feed role for accessibility', () => {
    const { container } = render(
      <CareNoteTimeline
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    const feed = container.querySelector('[role="feed"]');
    expect(feed).toBeTruthy();
  });

  it('singular note count text', () => {
    const singleResult: CareNoteListResult = {
      notes: [mockNote],
      totalCount: 1,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };
    render(
      <CareNoteTimeline
        initialData={singleResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('1 note recorded')).toBeTruthy();
  });
});
