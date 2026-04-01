/**
 * AuditHistoryTab Component Tests
 *
 * Covers:
 * - Empty state rendering when no entries
 * - Timeline rendering with audit entries
 * - User attribution (name shown when user present)
 * - System event rendering (no user)
 * - Action badges shown for each entry
 * - Immutability badge displayed
 * - Entry count display
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditHistoryTab } from '@/components/audit/audit-history-tab';
import type { AuditLogEntry } from '@/features/audit/actions';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockEntry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
  id: 'entry-1',
  action: 'create',
  entityType: 'person',
  entityId: 'person-uuid',
  changes: { before: null, after: { name: 'Alice' } },
  ipAddress: null,
  createdAt: new Date('2024-01-15T10:30:00Z'),
  user: { id: 'user-1', name: 'Jane Carer', email: 'jane@example.com' },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuditHistoryTab', () => {
  it('renders empty state when no entries', () => {
    render(<AuditHistoryTab entries={[]} />);
    expect(screen.getByText('No history yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Changes to this record will appear here automatically/),
    ).toBeInTheDocument();
  });

  it('renders the entry count in the header', () => {
    const entries = [mockEntry(), mockEntry({ id: 'entry-2' })];
    render(<AuditHistoryTab entries={entries} />);
    expect(screen.getByText(/2 entries/)).toBeInTheDocument();
  });

  it('renders singular "entry" when count is 1', () => {
    render(<AuditHistoryTab entries={[mockEntry()]} />);
    expect(screen.getByText(/1 entry/)).toBeInTheDocument();
  });

  it('shows the user name for each entry', () => {
    render(<AuditHistoryTab entries={[mockEntry()]} />);
    expect(screen.getByText('Jane Carer')).toBeInTheDocument();
  });

  it('shows "System" when no user on the entry', () => {
    render(<AuditHistoryTab entries={[mockEntry({ user: null })]} />);
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders an action badge for each entry', () => {
    render(<AuditHistoryTab entries={[mockEntry()]} />);
    expect(screen.getByText('create')).toBeInTheDocument();
  });

  it('renders multiple entries', () => {
    const entries = [
      mockEntry({ id: 'e1', action: 'create' }),
      mockEntry({ id: 'e2', action: 'update', user: { id: 'u2', name: 'Bob Manager', email: 'bob@example.com' } }),
      mockEntry({ id: 'e3', action: 'delete' }),
    ];
    render(<AuditHistoryTab entries={entries} />);
    expect(screen.getByText('create')).toBeInTheDocument();
    expect(screen.getByText('update')).toBeInTheDocument();
    expect(screen.getByText('delete')).toBeInTheDocument();
    expect(screen.getByText('Bob Manager')).toBeInTheDocument();
  });

  it('shows the "Immutable audit trail" badge', () => {
    render(<AuditHistoryTab entries={[mockEntry()]} />);
    expect(screen.getByText('Immutable audit trail')).toBeInTheDocument();
  });

  it('shows "Change history" heading', () => {
    render(<AuditHistoryTab entries={[mockEntry()]} />);
    expect(screen.getByText('Change history')).toBeInTheDocument();
  });

  it('includes entity type in description when provided', () => {
    render(<AuditHistoryTab entries={[mockEntry()]} entityType="person" />);
    expect(screen.getByText(/for this person/)).toBeInTheDocument();
  });

  it('renders as an ordered list for accessibility', () => {
    render(<AuditHistoryTab entries={[mockEntry()]} />);
    const list = screen.getByRole('list', { name: 'Audit history timeline' });
    expect(list).toBeInTheDocument();
  });

  it('shows IP address when present on entry', () => {
    render(<AuditHistoryTab entries={[mockEntry({ ipAddress: '10.0.0.1' })]} />);
    expect(screen.getByText(/10\.0\.0\.1/)).toBeInTheDocument();
  });
});
