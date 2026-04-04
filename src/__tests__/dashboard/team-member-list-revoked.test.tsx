/**
 * Tests for TeamMemberList component — revoked invitations section.
 *
 * Validates:
 * - Revoked invitations are shown with "Revoked" badge
 * - Revoked invitations are in their own section
 * - Pending invitations are shown separately
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamMemberList } from '@/components/organisations/team-member-list';
import type { OrgMember, OrgInvitation } from '@/features/organisations/actions';
import type { Role } from '@/lib/rbac/permissions';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/features/organisations/actions', () => ({
  changeMemberRole: vi.fn().mockResolvedValue({ success: true }),
  removeMember: vi.fn().mockResolvedValue({ success: true }),
  revokeInvitation: vi.fn().mockResolvedValue({ success: true }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockMembers: OrgMember[] = [
  {
    membershipId: 'membership-1',
    userId: 'user-1',
    name: 'Alice Owner',
    email: 'alice@example.com',
    role: 'owner' as Role,
    status: 'active',
    joinedAt: new Date('2024-01-01'),
  },
];

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

const mockPendingInvitation: OrgInvitation = {
  id: 'inv-pending-1',
  email: 'pending@example.com',
  role: 'carer' as Role,
  status: 'pending',
  expiresAt: futureDate,
  createdAt: new Date('2024-01-02'),
  inviterName: 'Alice Owner',
};

const mockRevokedInvitation: OrgInvitation = {
  id: 'inv-revoked-1',
  email: 'revoked@example.com',
  role: 'manager' as Role,
  status: 'revoked',
  expiresAt: pastDate,
  createdAt: new Date('2024-01-01'),
  inviterName: 'Alice Owner',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TeamMemberList — revoked invitations', () => {
  it('renders revoked invitations section when there are revoked invitations', () => {
    render(
      <TeamMemberList
        members={mockMembers}
        invitations={[mockRevokedInvitation]}
        currentUserId="user-1"
        currentUserRole="owner"
        canManage={true}
        orgId="org-1"
        orgSlug="test-org"
      />,
    );

    expect(screen.getByText('Revoked invitations (1)')).toBeInTheDocument();
  });

  it('shows "Revoked" badge on revoked invitations', () => {
    render(
      <TeamMemberList
        members={mockMembers}
        invitations={[mockRevokedInvitation]}
        currentUserId="user-1"
        currentUserRole="owner"
        canManage={true}
        orgId="org-1"
        orgSlug="test-org"
      />,
    );

    expect(screen.getByText('Revoked')).toBeInTheDocument();
    expect(screen.getByText('revoked@example.com')).toBeInTheDocument();
  });

  it('does not render revoked invitations section when there are none', () => {
    render(
      <TeamMemberList
        members={mockMembers}
        invitations={[mockPendingInvitation]}
        currentUserId="user-1"
        currentUserRole="owner"
        canManage={true}
        orgId="org-1"
        orgSlug="test-org"
      />,
    );

    expect(screen.queryByText(/Revoked invitations/)).not.toBeInTheDocument();
  });

  it('shows both pending and revoked invitations in separate sections', () => {
    render(
      <TeamMemberList
        members={mockMembers}
        invitations={[mockPendingInvitation, mockRevokedInvitation]}
        currentUserId="user-1"
        currentUserRole="owner"
        canManage={true}
        orgId="org-1"
        orgSlug="test-org"
      />,
    );

    expect(screen.getByText('Pending invitations (1)')).toBeInTheDocument();
    expect(screen.getByText('Revoked invitations (1)')).toBeInTheDocument();
    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    expect(screen.getByText('revoked@example.com')).toBeInTheDocument();
  });

  it('revoked invitation email is visible', () => {
    render(
      <TeamMemberList
        members={mockMembers}
        invitations={[mockPendingInvitation, mockRevokedInvitation]}
        currentUserId="user-1"
        currentUserRole="owner"
        canManage={true}
        orgId="org-1"
        orgSlug="test-org"
      />,
    );

    const revokedEmail = screen.getByText('revoked@example.com');
    expect(revokedEmail).toBeInTheDocument();
  });

  it('does NOT show revoke button for already-revoked invitations', () => {
    render(
      <TeamMemberList
        members={mockMembers}
        invitations={[mockRevokedInvitation]}
        currentUserId="user-1"
        currentUserRole="owner"
        canManage={true}
        orgId="org-1"
        orgSlug="test-org"
      />,
    );

    // The revoke button should not be present for revoked invitations
    const revokeButtons = screen.queryAllByRole('button', {
      name: /revoke invitation for revoked@example.com/i,
    });
    expect(revokeButtons).toHaveLength(0);
  });
});
