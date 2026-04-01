/**
 * Tests for document and body map UI components.
 *
 * Validates:
 * - DocumentCard renders document info, category, retention
 * - DocumentList renders empty state and document list
 * - DocumentList shows filter controls
 * - BodyMapSVG renders front/back outlines with markers
 * - BodyMapHistory renders entries grouped by date
 * - BodyMap shows toggle and legend
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/test-org/persons/person-1/documents'),
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

import { DocumentCard } from '@/components/documents/document-card';
import { DocumentList } from '@/components/documents/document-list';
import { BodyMapSVG } from '@/components/documents/body-map-svg';
import { BodyMapHistory } from '@/components/documents/body-map-history';
import { BodyMap } from '@/components/documents/body-map';
import type {
  DocumentListItem,
  DocumentListResult,
  BodyMapEntryListItem,
  BodyMapEntryListResult,
} from '@/features/documents/actions';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockDocument: DocumentListItem = {
  id: 'doc-1',
  personId: 'person-1',
  name: 'Initial Assessment Report',
  fileName: 'assessment-report.pdf',
  fileType: 'application/pdf',
  fileSize: 2048000,
  category: 'assessment',
  version: 1,
  retentionPolicy: 'standard',
  storageUrl: 'https://blob.storage.com/assessment-report.pdf',
  uploadedById: 'user-1',
  uploadedByName: 'Jane Smith',
  createdAt: new Date('2026-03-15T09:30:00Z'),
  updatedAt: new Date('2026-03-15T09:30:00Z'),
};

const mockDocumentV2: DocumentListItem = {
  ...mockDocument,
  id: 'doc-2',
  name: 'Consent Form',
  fileName: 'consent.docx',
  fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  fileSize: 512000,
  category: 'consent',
  version: 2,
  retentionPolicy: 'permanent',
  uploadedByName: 'John Doe',
  createdAt: new Date('2026-03-20T14:00:00Z'),
  updatedAt: new Date('2026-03-20T14:00:00Z'),
};

const mockBodyMapEntry: BodyMapEntryListItem = {
  id: 'entry-1',
  personId: 'person-1',
  bodyRegion: 'left_arm',
  side: 'front',
  xPercent: 25.5,
  yPercent: 40.2,
  entryType: 'bruise',
  description: 'Small purple bruise on inner left arm, approximately 2cm diameter',
  dateObserved: '2026-03-28',
  linkedIncidentId: null,
  createdById: 'user-1',
  createdByName: 'Jane Smith',
  createdAt: new Date('2026-03-28T10:00:00Z'),
};

const mockBodyMapEntry2: BodyMapEntryListItem = {
  id: 'entry-2',
  personId: 'person-1',
  bodyRegion: 'right_leg',
  side: 'front',
  xPercent: 60,
  yPercent: 70,
  entryType: 'wound',
  description: 'Skin tear on right shin',
  dateObserved: '2026-03-28',
  linkedIncidentId: null,
  createdById: 'user-2',
  createdByName: 'John Doe',
  createdAt: new Date('2026-03-28T11:00:00Z'),
};

const mockBodyMapEntry3: BodyMapEntryListItem = {
  ...mockBodyMapEntry,
  id: 'entry-3',
  bodyRegion: 'upper_back',
  side: 'back',
  xPercent: 50,
  yPercent: 28,
  entryType: 'mark',
  description: 'Pressure mark observed on upper back',
  dateObserved: '2026-03-25',
  createdByName: 'Jane Smith',
  createdAt: new Date('2026-03-25T09:00:00Z'),
};

// ---------------------------------------------------------------------------
// DocumentCard
// ---------------------------------------------------------------------------

describe('DocumentCard', () => {
  it('renders document name', () => {
    render(<DocumentCard document={mockDocument} />);
    expect(screen.getByText('Initial Assessment Report')).toBeTruthy();
  });

  it('renders file name', () => {
    render(<DocumentCard document={mockDocument} />);
    expect(screen.getByText('assessment-report.pdf')).toBeTruthy();
  });

  it('renders category badge', () => {
    render(<DocumentCard document={mockDocument} />);
    expect(screen.getByText('Assessment')).toBeTruthy();
  });

  it('renders version badge when version > 1', () => {
    render(<DocumentCard document={mockDocumentV2} />);
    expect(screen.getByText('v2')).toBeTruthy();
  });

  it('does not render version badge for v1', () => {
    render(<DocumentCard document={mockDocument} />);
    expect(screen.queryByText('v1')).toBeNull();
  });

  it('renders uploader name', () => {
    render(<DocumentCard document={mockDocument} />);
    expect(screen.getByText('by Jane Smith')).toBeTruthy();
  });

  it('renders retention policy', () => {
    render(<DocumentCard document={mockDocumentV2} />);
    expect(screen.getByText(/Permanent/)).toBeTruthy();
  });

  it('renders download link', () => {
    render(<DocumentCard document={mockDocument} />);
    const downloadLink = screen.getByLabelText('Download Initial Assessment Report');
    expect(downloadLink).toBeTruthy();
    expect(downloadLink.getAttribute('href')).toBe(mockDocument.storageUrl);
  });

  it('has accessible article role', () => {
    const { container } = render(<DocumentCard document={mockDocument} />);
    const article = container.querySelector('article');
    expect(article).toBeTruthy();
    expect(article?.getAttribute('aria-label')).toContain('Initial Assessment Report');
  });
});

// ---------------------------------------------------------------------------
// DocumentList
// ---------------------------------------------------------------------------

describe('DocumentList', () => {
  const emptyResult: DocumentListResult = {
    documents: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
    totalPages: 0,
  };

  const populatedResult: DocumentListResult = {
    documents: [mockDocument, mockDocumentV2],
    totalCount: 2,
    page: 1,
    pageSize: 25,
    totalPages: 1,
  };

  const mockFilter = vi.fn().mockResolvedValue(emptyResult);

  it('renders empty state when no documents', () => {
    render(
      <DocumentList
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('No documents found.')).toBeTruthy();
  });

  it('renders "Upload the first document" in empty state when canCreate', () => {
    render(
      <DocumentList
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('Upload the first document')).toBeTruthy();
  });

  it('renders document cards when data is present', () => {
    render(
      <DocumentList
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('Initial Assessment Report')).toBeTruthy();
    expect(screen.getByText('Consent Form')).toBeTruthy();
  });

  it('shows total count', () => {
    render(
      <DocumentList
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('2 documents')).toBeTruthy();
  });

  it('shows singular count text', () => {
    const singleResult: DocumentListResult = {
      documents: [mockDocument],
      totalCount: 1,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };
    render(
      <DocumentList
        initialData={singleResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('1 document')).toBeTruthy();
  });

  it('shows "Upload Document" button when canCreate', () => {
    render(
      <DocumentList
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('Upload Document')).toBeTruthy();
  });

  it('hides "Upload Document" button when canCreate is false', () => {
    render(
      <DocumentList
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={false}
        onFilter={mockFilter}
      />,
    );
    expect(screen.queryByText('Upload Document')).toBeNull();
  });

  it('renders category filter', () => {
    render(
      <DocumentList
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByLabelText('Category')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// BodyMapSVG
// ---------------------------------------------------------------------------

describe('BodyMapSVG', () => {
  it('renders front view with correct aria label', () => {
    const { container } = render(
      <BodyMapSVG side="front" entries={[]} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-label')).toContain('front view');
  });

  it('renders back view with correct aria label', () => {
    const { container } = render(
      <BodyMapSVG side="back" entries={[]} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toContain('back view');
  });

  it('renders markers for entries on matching side', () => {
    const { container } = render(
      <BodyMapSVG
        side="front"
        entries={[mockBodyMapEntry, mockBodyMapEntry2]}
      />,
    );
    // Both entries are on 'front' side, so we should have 2 marker circles (plus any SVG circles)
    const circles = container.querySelectorAll('circle[r="6"]');
    expect(circles.length).toBe(2);
  });

  it('does not render markers for entries on opposite side', () => {
    const { container } = render(
      <BodyMapSVG
        side="front"
        entries={[mockBodyMapEntry3]} // back side entry
      />,
    );
    const circles = container.querySelectorAll('circle[r="6"]');
    expect(circles.length).toBe(0);
  });

  it('shows marker count in aria label', () => {
    const { container } = render(
      <BodyMapSVG
        side="front"
        entries={[mockBodyMapEntry, mockBodyMapEntry2]}
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toContain('2 markers shown');
  });

  it('renders side label text', () => {
    render(<BodyMapSVG side="front" entries={[]} />);
    expect(screen.getByText('Front')).toBeTruthy();
  });

  it('renders back label text', () => {
    render(<BodyMapSVG side="back" entries={[]} />);
    expect(screen.getByText('Back')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// BodyMapHistory
// ---------------------------------------------------------------------------

describe('BodyMapHistory', () => {
  it('renders empty state when no entries', () => {
    render(<BodyMapHistory entries={[]} />);
    expect(screen.getByText('No body map entries recorded.')).toBeTruthy();
  });

  it('renders entry count', () => {
    render(
      <BodyMapHistory entries={[mockBodyMapEntry, mockBodyMapEntry2]} />,
    );
    expect(screen.getByText('History (2 entries)')).toBeTruthy();
  });

  it('renders singular entry count', () => {
    render(<BodyMapHistory entries={[mockBodyMapEntry]} />);
    expect(screen.getByText('History (1 entry)')).toBeTruthy();
  });

  it('renders entry type label', () => {
    render(<BodyMapHistory entries={[mockBodyMapEntry]} />);
    expect(screen.getByText('Bruise')).toBeTruthy();
  });

  it('renders body region', () => {
    render(<BodyMapHistory entries={[mockBodyMapEntry]} />);
    expect(screen.getByText(/Left Arm/)).toBeTruthy();
  });

  it('renders entry description', () => {
    render(<BodyMapHistory entries={[mockBodyMapEntry]} />);
    expect(screen.getByText(/Small purple bruise/)).toBeTruthy();
  });

  it('renders creator name', () => {
    render(<BodyMapHistory entries={[mockBodyMapEntry]} />);
    expect(screen.getByText('Jane Smith')).toBeTruthy();
  });

  it('groups entries by date', () => {
    // Both entries have same dateObserved, entry3 has different date
    render(
      <BodyMapHistory
        entries={[mockBodyMapEntry, mockBodyMapEntry2, mockBodyMapEntry3]}
      />,
    );
    // Should have accessible list
    const list = screen.getByRole('list', { name: 'Body map history' });
    expect(list).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// BodyMap (composite)
// ---------------------------------------------------------------------------

describe('BodyMap', () => {
  const emptyResult: BodyMapEntryListResult = {
    entries: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  };

  const populatedResult: BodyMapEntryListResult = {
    entries: [mockBodyMapEntry, mockBodyMapEntry2],
    totalCount: 2,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  };

  const mockFilter = vi.fn().mockResolvedValue(emptyResult);

  it('renders heading', () => {
    render(
      <BodyMap
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText('Body Map')).toBeTruthy();
  });

  it('renders entry count', () => {
    render(
      <BodyMap
        initialData={populatedResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByText(/2 entries recorded/)).toBeTruthy();
  });

  it('renders front/back toggle buttons', () => {
    render(
      <BodyMap
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    const frontButton = screen.getAllByText('Front').find(
      (el) => el.getAttribute('role') === 'radio',
    );
    const backButton = screen.getAllByText('Back').find(
      (el) => el.getAttribute('role') === 'radio',
    );
    expect(frontButton).toBeTruthy();
    expect(backButton).toBeTruthy();
  });

  it('renders legend', () => {
    render(
      <BodyMap
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    // Legend items appear both in the legend and in the filter dropdown,
    // so use getAllByText and check at least 2 occurrences (legend + dropdown)
    expect(screen.getAllByText('Injury').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Wound').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Bruise').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Mark').length).toBeGreaterThanOrEqual(2);
  });

  it('renders filter dropdown', () => {
    render(
      <BodyMap
        initialData={emptyResult}
        personId="person-1"
        orgSlug="test-org"
        canCreate={true}
        onFilter={mockFilter}
      />,
    );
    expect(screen.getByLabelText('Filter:')).toBeTruthy();
  });
});
