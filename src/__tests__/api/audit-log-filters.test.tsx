/**
 * Tests for AuditLogFilters component.
 *
 * Validates:
 * - User filter dropdown renders when members are provided
 * - User filter is hidden when no members are provided
 * - All existing filters remain functional
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditLogFilters } from '@/components/audit/audit-log-filters';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/test-org/audit-log',
  useSearchParams: () => new URLSearchParams(),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuditLogFilters — user filter', () => {
  it('renders user filter when members are provided', () => {
    render(
      <AuditLogFilters
        entityTypes={['organisation', 'person']}
        members={[
          { id: 'user-1', name: 'Alice Manager' },
          { id: 'user-2', name: 'Bob Carer' },
        ]}
      />,
    );

    expect(screen.getByLabelText('User')).toBeInTheDocument();
  });

  it('does not render user filter when no members are provided', () => {
    render(
      <AuditLogFilters
        entityTypes={['organisation', 'person']}
      />,
    );

    expect(screen.queryByLabelText('User')).not.toBeInTheDocument();
  });

  it('shows all members in user filter dropdown', () => {
    render(
      <AuditLogFilters
        entityTypes={['organisation']}
        members={[
          { id: 'user-1', name: 'Alice Manager' },
          { id: 'user-2', name: 'Bob Carer' },
        ]}
      />,
    );

    expect(screen.getByText('Alice Manager')).toBeInTheDocument();
    expect(screen.getByText('Bob Carer')).toBeInTheDocument();
  });

  it('shows "All users" as default option', () => {
    render(
      <AuditLogFilters
        entityTypes={['organisation']}
        members={[{ id: 'user-1', name: 'Alice Manager' }]}
      />,
    );

    expect(screen.getByText('All users')).toBeInTheDocument();
  });

  it('still shows other filters alongside user filter', () => {
    render(
      <AuditLogFilters
        entityTypes={['organisation', 'person']}
        members={[{ id: 'user-1', name: 'Alice' }]}
      />,
    );

    // Search filter
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    // Action filter
    expect(screen.getByLabelText('Action')).toBeInTheDocument();
    // Entity type filter
    expect(screen.getByLabelText('Entity type')).toBeInTheDocument();
    // User filter
    expect(screen.getByLabelText('User')).toBeInTheDocument();
  });
});
