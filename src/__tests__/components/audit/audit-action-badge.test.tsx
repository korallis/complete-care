/**
 * AuditActionBadge Component Tests
 *
 * Covers:
 * - Renders the correct action text
 * - Applies the correct semantic colour classes for each action type
 * - Handles unknown action types (fallback to 'other' variant)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditActionBadge } from '@/components/audit/audit-action-badge';

describe('AuditActionBadge', () => {
  it('renders the action text', () => {
    render(<AuditActionBadge action="create" />);
    expect(screen.getByText('create')).toBeInTheDocument();
  });

  it('renders "update" action', () => {
    render(<AuditActionBadge action="update" />);
    expect(screen.getByText('update')).toBeInTheDocument();
  });

  it('renders "delete" action', () => {
    render(<AuditActionBadge action="delete" />);
    expect(screen.getByText('delete')).toBeInTheDocument();
  });

  it('renders custom action strings', () => {
    render(<AuditActionBadge action="login" />);
    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('applies emerald (create) styling for create action', () => {
    render(<AuditActionBadge action="create" />);
    const badge = screen.getByText('create');
    expect(badge.className).toContain('emerald');
  });

  it('applies blue (update) styling for update action', () => {
    render(<AuditActionBadge action="update" />);
    const badge = screen.getByText('update');
    expect(badge.className).toContain('blue');
  });

  it('applies rose/red (delete) styling for delete action', () => {
    render(<AuditActionBadge action="delete" />);
    const badge = screen.getByText('delete');
    expect(badge.className).toContain('rose');
  });

  it('applies amber (other) styling for unrecognised action', () => {
    render(<AuditActionBadge action="login" />);
    const badge = screen.getByText('login');
    expect(badge.className).toContain('amber');
  });

  it('accepts and applies custom className', () => {
    render(<AuditActionBadge action="create" className="my-custom-class" />);
    const badge = screen.getByText('create');
    expect(badge.className).toContain('my-custom-class');
  });

  it('renders as a span element', () => {
    render(<AuditActionBadge action="create" />);
    const badge = screen.getByText('create');
    expect(badge.tagName).toBe('SPAN');
  });
});
