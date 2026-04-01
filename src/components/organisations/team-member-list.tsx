'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  changeMemberRole,
  removeMember,
  revokeInvitation,
} from '@/features/organisations/actions';
import type { OrgMember, OrgInvitation } from '@/features/organisations/actions';
import type { Role } from '@/lib/rbac/permissions';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  senior_carer: 'Senior Carer',
  carer: 'Carer',
  viewer: 'Viewer',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  accepted: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  expired: 'text-red-700 bg-red-50 border-red-200',
  revoked: 'text-gray-600 bg-gray-50 border-gray-200',
};

const INVITABLE_ROLES: Role[] = [
  'admin',
  'manager',
  'senior_carer',
  'carer',
  'viewer',
];

interface TeamMemberListProps {
  members: OrgMember[];
  invitations: OrgInvitation[];
  currentUserId: string;
  currentUserRole: string;
  canManage: boolean;
  orgId: string;
  orgSlug: string;
}

export function TeamMemberList({
  members,
  invitations,
  currentUserId,
  currentUserRole,
  canManage,
}: TeamMemberListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string>('');

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');
  const revokedInvitations = invitations.filter((i) => i.status === 'revoked');

  function handleRoleChange(memberId: string, newRole: string) {
    setActionError('');
    startTransition(async () => {
      const result = await changeMemberRole({ memberId, role: newRole });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    setActionError('');
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRevokeInvitation(invitationId: string) {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    setActionError('');
    startTransition(async () => {
      const result = await revokeInvitation(invitationId);
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (members.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">No members yet.</p>
      </div>
    );
  }

  return (
    <div>
      {actionError && (
        <div
          className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {/* Active members */}
      <ul className="divide-y divide-[oklch(0.94_0.003_150)]" role="list">
        {members.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const isOwner = member.role === 'owner';
          const canChangeRole =
            canManage && !isOwner && !(isCurrentUser && currentUserRole === 'owner');
          // Regular remove: only for non-owners. For owner's own row, show a special "Leave" button.
          const canRemove = canManage && !isOwner;
          // Show a "Leave" button for the current user if they're the owner.
          // Clicking it will trigger the server-side "transfer ownership first" error.
          const showLeaveButton = isCurrentUser && isOwner;

          return (
            <li
              key={member.membershipId}
              className="flex items-center gap-4 px-6 py-4"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-[oklch(0.92_0.01_160)] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-[oklch(0.35_0.05_160)]">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Name & email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-[oklch(0.18_0.02_160)] truncate">
                    {member.name}
                  </p>
                  {isCurrentUser && (
                    <span className="text-xs text-[oklch(0.55_0_0)] border border-[oklch(0.88_0_0)] rounded-full px-2 py-0.5">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-[oklch(0.5_0_0)] truncate mt-0.5">
                  {member.email}
                </p>
              </div>

              {/* Role */}
              <div className="flex-shrink-0">
                {canChangeRole ? (
                  <Select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.membershipId, e.target.value)
                    }
                    disabled={isPending}
                    aria-label={`Role for ${member.name}`}
                    className="h-8 w-36 text-xs"
                  >
                    {INVITABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <span className="text-xs font-medium text-[oklch(0.38_0.04_160)] bg-[oklch(0.95_0.01_160)] border border-[oklch(0.88_0.02_160)] rounded-full px-2.5 py-1">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                )}
              </div>

              {/* Remove button (for non-owners) */}
              {canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.membershipId)}
                  disabled={isPending}
                  aria-label={`Remove ${member.name}`}
                  className="flex-shrink-0 text-[oklch(0.55_0_0)] hover:text-red-600 hover:bg-red-50 h-8 px-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                  </svg>
                </Button>
              )}
              {/* Leave button for current user when they're the owner (self-removal of owner) */}
              {showLeaveButton && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.membershipId)}
                  disabled={isPending}
                  aria-label="Leave organisation"
                  className="flex-shrink-0 text-xs text-[oklch(0.55_0_0)] hover:text-red-600 hover:bg-red-50 h-8 px-2"
                  title="You must transfer ownership before leaving this organisation"
                >
                  Leave
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-[oklch(0.97_0.003_150)] border-t border-[oklch(0.93_0.005_150)]">
            <h3 className="text-xs font-semibold text-[oklch(0.48_0_0)] uppercase tracking-wider">
              Pending invitations ({pendingInvitations.length})
            </h3>
          </div>
          <ul
            className="divide-y divide-[oklch(0.94_0.003_150)]"
            role="list"
            aria-label="Pending invitations"
          >
            {pendingInvitations.map((invitation) => {
              const isExpired = invitation.expiresAt < new Date();
              return (
                <li
                  key={invitation.id}
                  className="flex items-center gap-4 px-6 py-3.5"
                >
                  {/* Avatar placeholder */}
                  <div className="w-9 h-9 rounded-full bg-[oklch(0.93_0.005_150)] flex items-center justify-center flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="oklch(0.6 0 0)"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4.5 h-4.5"
                      aria-hidden="true"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[oklch(0.25_0.02_160)] truncate">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-[oklch(0.5_0_0)] mt-0.5">
                      Invited by {invitation.inviterName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-medium text-[oklch(0.38_0.04_160)] bg-[oklch(0.95_0.01_160)] border border-[oklch(0.88_0.02_160)] rounded-full px-2.5 py-1">
                      {ROLE_LABELS[invitation.role] ?? invitation.role}
                    </span>
                    <span
                      className={`text-xs font-medium border rounded-full px-2.5 py-1 ${
                        isExpired
                          ? STATUS_COLORS.expired
                          : STATUS_COLORS.pending
                      }`}
                    >
                      {isExpired ? 'Expired' : 'Pending'}
                    </span>
                  </div>

                  {canManage && !isExpired && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      disabled={isPending}
                      aria-label={`Revoke invitation for ${invitation.email}`}
                      className="flex-shrink-0 text-xs text-[oklch(0.55_0_0)] hover:text-red-600 hover:bg-red-50 h-8 px-2"
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Revoked invitations */}
      {revokedInvitations.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-[oklch(0.97_0.003_150)] border-t border-[oklch(0.93_0.005_150)]">
            <h3 className="text-xs font-semibold text-[oklch(0.48_0_0)] uppercase tracking-wider">
              Revoked invitations ({revokedInvitations.length})
            </h3>
          </div>
          <ul
            className="divide-y divide-[oklch(0.94_0.003_150)]"
            role="list"
            aria-label="Revoked invitations"
          >
            {revokedInvitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center gap-4 px-6 py-3.5 opacity-60"
              >
                {/* Avatar placeholder */}
                <div className="w-9 h-9 rounded-full bg-[oklch(0.93_0.005_150)] flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="oklch(0.6 0 0)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4.5 h-4.5"
                    aria-hidden="true"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[oklch(0.35_0.01_160)] truncate">
                    {invitation.email}
                  </p>
                  <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
                    Invited by {invitation.inviterName}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-[oklch(0.38_0.04_160)] bg-[oklch(0.95_0.01_160)] border border-[oklch(0.88_0.02_160)] rounded-full px-2.5 py-1">
                    {ROLE_LABELS[invitation.role] ?? invitation.role}
                  </span>
                  <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${STATUS_COLORS.revoked}`}>
                    Revoked
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
