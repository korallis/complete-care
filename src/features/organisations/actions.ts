'use server';

/**
 * Organisation Server Actions
 *
 * All mutations for the multi-tenant organisation system:
 * - Create organisation (onboarding flow)
 * - Invite team members (email invitation)
 * - Accept invitation (via token link)
 * - Revoke invitation
 * - Update organisation settings (name, slug, domains)
 * - Change member role
 * - Remove member
 * - Switch active organisation (updates JWT session)
 */

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  organisations,
  memberships,
  invitations,
  auditLogs,
  users,
} from '@/lib/db/schema';
import { INVITATION_STATUS, invitationExpiry } from '@/lib/db/schema/invitations';
import { auth } from '@/auth';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import type { Role } from '@/lib/rbac/permissions';
import { generateToken } from '@/lib/auth/validation';
import { sendInvitationEmail } from '@/lib/email/invitation';
import type { ActionResult } from '@/types';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

/** Generates a URL-safe slug from a name */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63); // Postgres VARCHAR limit
}

const ORG_TYPE_VALUES = [
  'independent_provider',
  'care_group',
  'nhs_statutory',
  'local_authority',
  'charity_nfp',
  'other',
] as const;


const CARE_DOMAIN_VALUES = [
  'domiciliary_care',
  'supported_living',
  'complex_care',
  'childrens_homes',
  'domiciliary',
  'childrens_residential',
] as const;

const CARE_DOMAIN_CANONICAL_MAP = {
  domiciliary: 'domiciliary_care',
  domiciliary_care: 'domiciliary_care',
  supported_living: 'supported_living',
  complex_care: 'complex_care',
  childrens_residential: 'childrens_homes',
  childrens_homes: 'childrens_homes',
} as const;

function normalizeCareDomains(domains: readonly string[]) {
  return [...new Set(domains.map((domain) => CARE_DOMAIN_CANONICAL_MAP[domain as keyof typeof CARE_DOMAIN_CANONICAL_MAP] ?? domain))];
}

const createOrganisationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organisation name is required')
    .max(100, 'Organisation name must be 100 characters or fewer'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(63, 'Slug must be 63 characters or fewer')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens',
    ),
  orgType: z.enum(ORG_TYPE_VALUES).optional(),
  domains: z
    .array(
      z.enum(CARE_DOMAIN_VALUES),
    )
    .min(1, 'At least one care domain must be selected'),
});

const updateOrgSettingsSchema = z.object({
  name: z
    .string()
    .min(1, 'Organisation name is required')
    .max(100, 'Organisation name must be 100 characters or fewer'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(63, 'Slug must be 63 characters or fewer')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens',
    ),
  domains: z
    .array(
      z.enum(CARE_DOMAIN_VALUES),
    )
    .min(1, 'At least one care domain must be selected'),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'senior_carer', 'carer', 'viewer'], {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

const changeMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  // We validate non-owner roles here; we also block 'owner' explicitly in the action
  role: z.string().min(1, 'Role is required'),
});

// ---------------------------------------------------------------------------
// Action: createOrganisation
// ---------------------------------------------------------------------------

/**
 * Creates a new organisation and assigns the current user as owner.
 * Used in the onboarding flow for new users, and from "New Organisation" for existing users.
 */
export async function createOrganisation(
  formData: FormData | { name: string; slug: string; orgType?: string; domains: string[] },
): Promise<ActionResult<{ orgId: string; orgSlug: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = session.user.id;

  // Parse input
  const rawData =
    formData instanceof FormData
      ? {
          name: formData.get('name') as string,
          slug: formData.get('slug') as string,
          orgType: (formData.get('orgType') as string) || undefined,
          domains: (formData.getAll('domains') as string[]),
        }
      : formData;

  const parsed = createOrganisationSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError.message,
      field: firstError.path[0] as string,
    };
  }

  const { name, slug, orgType } = parsed.data;
  const domains = normalizeCareDomains(parsed.data.domains);

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.slug, slug))
    .limit(1);

  if (existing) {
    return {
      success: false,
      error: 'This slug is already taken. Please choose another.',
      field: 'slug',
    };
  }

  // Create the organisation
  const [newOrg] = await db
    .insert(organisations)
    .values({
      name,
      slug,
      orgType: orgType ?? null,
      domains,
      plan: 'free',
    })
    .returning({ id: organisations.id, slug: organisations.slug });

  if (!newOrg) {
    return { success: false, error: 'Failed to create organisation' };
  }

  // Create owner membership for the current user
  await db.insert(memberships).values({
    userId,
    organisationId: newOrg.id,
    role: 'owner',
    status: 'active',
  });

  // Audit log
  await db.insert(auditLogs).values({
    userId,
    organisationId: newOrg.id,
    action: 'create',
    entityType: 'organisation',
    entityId: newOrg.id,
    changes: { after: { name, slug, orgType, domains } },
  });

  revalidatePath('/dashboard');
  revalidatePath('/onboarding');

  return { success: true, data: { orgId: newOrg.id, orgSlug: newOrg.slug } };
}

// ---------------------------------------------------------------------------
// Action: createOrganisationWithInvites
// ---------------------------------------------------------------------------

const createOrgWithInvitesSchema = z.object({
  name: z
    .string()
    .min(1, 'Organisation name is required')
    .max(100, 'Organisation name must be 100 characters or fewer'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(63, 'Slug must be 63 characters or fewer')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens',
    ),
  orgType: z.enum(ORG_TYPE_VALUES).optional(),
  domains: z
    .array(
      z.enum(CARE_DOMAIN_VALUES),
    )
    .min(1, 'At least one care domain must be selected'),
  invites: z
    .array(
      z.object({
        email: z.string().email('Invalid email address'),
        role: z.enum(['admin', 'manager', 'senior_carer', 'carer', 'viewer']),
      }),
    )
    .optional()
    .default([]),
});

/**
 * Creates a new organisation with the owner membership, then sends team invitations.
 * Used as the final step of the onboarding wizard.
 * Does NOT require requirePermission() since the org is being created in this call.
 */
export async function createOrganisationWithInvites(data: {
  name: string;
  slug: string;
  orgType?: string;
  domains: string[];
  invites: Array<{ email: string; role: string }>;
}): Promise<ActionResult<{ orgId: string; orgSlug: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = session.user.id;

  const parsed = createOrgWithInvitesSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError.message,
      field: firstError.path[0] as string,
    };
  }

  const { name, slug, orgType, domains, invites } = parsed.data;

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.slug, slug))
    .limit(1);

  if (existing) {
    return {
      success: false,
      error: 'This slug is already taken. Please choose another.',
      field: 'slug',
    };
  }

  // Create the organisation
  const [newOrg] = await db
    .insert(organisations)
    .values({
      name,
      slug,
      orgType: orgType ?? null,
      domains,
      plan: 'free',
    })
    .returning({ id: organisations.id, slug: organisations.slug });

  if (!newOrg) {
    return { success: false, error: 'Failed to create organisation' };
  }

  // Create owner membership
  await db.insert(memberships).values({
    userId,
    organisationId: newOrg.id,
    role: 'owner',
    status: 'active',
  });

  // Audit log for org creation
  await db.insert(auditLogs).values({
    userId,
    organisationId: newOrg.id,
    action: 'create',
    entityType: 'organisation',
    entityId: newOrg.id,
    changes: { after: { name, slug, orgType, domains } },
  });

  // Send team invitations (best-effort — failures don't abort org creation)
  if (invites.length > 0) {
    // Fetch inviter name for email
    const [inviter] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // De-duplicate by email (case-insensitive)
    const uniqueInvites = Array.from(
      new Map(invites.map((i) => [i.email.toLowerCase(), i])).values(),
    );

    for (const invite of uniqueInvites) {
      try {
        const token = generateToken(32);
        const [newInvitation] = await db
          .insert(invitations)
          .values({
            organisationId: newOrg.id,
            email: invite.email.toLowerCase(),
            role: invite.role,
            token,
            status: INVITATION_STATUS.PENDING,
            invitedBy: userId,
            expiresAt: invitationExpiry(),
          })
          .returning({ id: invitations.id });

        if (newInvitation) {
          await sendInvitationEmail(invite.email.toLowerCase(), {
            token,
            orgName: name,
            inviterName: inviter?.name ?? 'Your organisation administrator',
            role: invite.role,
          });

          await db.insert(auditLogs).values({
            userId,
            organisationId: newOrg.id,
            action: 'invite',
            entityType: 'invitation',
            entityId: newInvitation.id,
            changes: { after: { email: invite.email, role: invite.role } },
          });
        }
      } catch (err) {
        // Log error but don't fail the whole onboarding flow
        console.error(
          `[onboarding] Failed to send invitation to ${invite.email}:`,
          err,
        );
      }
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/onboarding');

  return { success: true, data: { orgId: newOrg.id, orgSlug: newOrg.slug } };
}

// ---------------------------------------------------------------------------
// Action: generateOrgSlug (utility, not a mutation)
// ---------------------------------------------------------------------------

/**
 * Generates a slug from an org name, checking for uniqueness.
 * Pure utility — does not mutate the database.
 */
export async function generateOrgSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  if (!base) return '';

  // Check if base slug is taken
  const [existing] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.slug, base))
    .limit(1);

  if (!existing) return base;

  // Append incrementing number until unique
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    const [taken] = await db
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, candidate))
      .limit(1);
    if (!taken) return candidate;
  }

  return `${base}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Action: updateOrgSettings
// ---------------------------------------------------------------------------

/**
 * Updates organisation name, slug, and care domains.
 * Requires admin+ role.
 */
export async function updateOrgSettings(
  orgId: string,
  data: { name: string; slug: string; domains: string[] },
): Promise<ActionResult<void>> {
  const { userId, orgId: activeOrgId } = await requirePermission(
    'manage',
    'organisation',
  ).catch(() => {
    throw new UnauthorizedError();
  });

  // Ensure the request targets the user's active org
  if (orgId !== activeOrgId) {
    return { success: false, error: 'Access denied' };
  }

  const parsed = updateOrgSettingsSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError.message,
      field: firstError.path[0] as string,
    };
  }

  const { name, slug } = parsed.data;
  const domains = normalizeCareDomains(parsed.data.domains);

  // Fetch current org to capture before state for audit
  const [currentOrg] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (!currentOrg) {
    return { success: false, error: 'Organisation not found' };
  }

  // Check slug uniqueness (allow same slug for the current org)
  if (slug !== currentOrg.slug) {
    const [existing] = await db
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, slug))
      .limit(1);

    if (existing) {
      return {
        success: false,
        error: 'This slug is already taken. Please choose another.',
        field: 'slug',
      };
    }
  }

  // Update the organisation
  await db
    .update(organisations)
    .set({ name, slug, domains, updatedAt: new Date() })
    .where(eq(organisations.id, orgId));

  // Audit log
  await db.insert(auditLogs).values({
    userId,
    organisationId: orgId,
    action: 'update',
    entityType: 'organisation',
    entityId: orgId,
    changes: {
      before: {
        name: currentOrg.name,
        slug: currentOrg.slug,
        domains: currentOrg.domains,
      },
      after: { name, slug, domains },
    },
  });

  revalidatePath(`/${slug}/settings`);
  revalidatePath(`/${currentOrg.slug}/settings`);

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Action: inviteMember
// ---------------------------------------------------------------------------

/**
 * Sends an email invitation to join the organisation.
 * Requires admin+ role.
 * Creates an invitation record with a 7-day expiry.
 */
export async function inviteMember(
  orgId: string,
  data: { email: string; role: string },
): Promise<ActionResult<{ invitationId: string }>> {
  const { userId, orgId: activeOrgId } = await requirePermission(
    'manage',
    'users',
  ).catch(() => {
    throw new UnauthorizedError();
  });

  if (orgId !== activeOrgId) {
    return { success: false, error: 'Access denied' };
  }

  const parsed = inviteMemberSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError.message,
      field: firstError.path[0] as string,
    };
  }

  const { email, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if the user is already a member
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser.length > 0) {
    const [existingMembership] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, existingUser[0].id),
          eq(memberships.organisationId, orgId),
          eq(memberships.status, 'active'),
        ),
      )
      .limit(1);

    if (existingMembership) {
      return {
        success: false,
        error: 'This user is already a member of the organisation',
        field: 'email',
      };
    }
  }

  // Revoke any existing pending invitation to this email for this org
  await db
    .update(invitations)
    .set({ status: INVITATION_STATUS.REVOKED })
    .where(
      and(
        eq(invitations.organisationId, orgId),
        eq(invitations.email, normalizedEmail),
        eq(invitations.status, INVITATION_STATUS.PENDING),
      ),
    );

  // Fetch org details for email
  const [org] = await db
    .select({ name: organisations.name, slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (!org) {
    return { success: false, error: 'Organisation not found' };
  }

  // Fetch inviter details for email
  const [inviter] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Create the invitation
  const token = generateToken(32);
  const [newInvitation] = await db
    .insert(invitations)
    .values({
      organisationId: orgId,
      email: normalizedEmail,
      role,
      token,
      status: INVITATION_STATUS.PENDING,
      invitedBy: userId,
      expiresAt: invitationExpiry(),
    })
    .returning({ id: invitations.id });

  if (!newInvitation) {
    return { success: false, error: 'Failed to create invitation' };
  }

  // Send invitation email
  await sendInvitationEmail(normalizedEmail, {
    token,
    orgName: org.name,
    inviterName: inviter?.name ?? 'A team member',
    role,
  });

  // Audit log
  await db.insert(auditLogs).values({
    userId,
    organisationId: orgId,
    action: 'invite',
    entityType: 'invitation',
    entityId: newInvitation.id,
    changes: { after: { email: normalizedEmail, role } },
  });

  revalidatePath(`/${org.slug}/settings/team`);

  return { success: true, data: { invitationId: newInvitation.id } };
}

// ---------------------------------------------------------------------------
// Action: acceptInvitation
// ---------------------------------------------------------------------------

/**
 * Accepts an invitation by token. The accepting user must be logged in.
 * Creates a membership record for the user in the organisation.
 */
export async function acceptInvitation(
  token: string,
): Promise<ActionResult<{ orgSlug: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = session.user.id;

  // Look up the invitation
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invitation) {
    return { success: false, error: 'Invitation not found' };
  }

  // Check expiry
  if (invitation.status === INVITATION_STATUS.EXPIRED || invitation.expiresAt < new Date()) {
    // Mark as expired if it hasn't been already
    if (invitation.status === INVITATION_STATUS.PENDING) {
      await db
        .update(invitations)
        .set({ status: INVITATION_STATUS.EXPIRED })
        .where(eq(invitations.id, invitation.id));
    }
    return { success: false, error: 'EXPIRED' };
  }

  // Check revoked
  if (invitation.status === INVITATION_STATUS.REVOKED) {
    return { success: false, error: 'REVOKED' };
  }

  // Check already accepted
  if (invitation.status === INVITATION_STATUS.ACCEPTED) {
    return { success: false, error: 'This invitation has already been used' };
  }

  // Verify the logged-in user's email matches the invitation email
  const [invitedUser] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!invitedUser || invitedUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return {
      success: false,
      error: 'This invitation was sent to a different email address',
    };
  }

  // Fetch org slug
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, invitation.organisationId))
    .limit(1);

  if (!org) {
    return { success: false, error: 'Organisation not found' };
  }

  // Check if already a member
  const [existingMembership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organisationId, invitation.organisationId),
      ),
    )
    .limit(1);

  if (!existingMembership) {
    // Create the membership
    await db.insert(memberships).values({
      userId,
      organisationId: invitation.organisationId,
      role: invitation.role,
      status: 'active',
    });
  } else {
    // Reactivate if suspended
    await db
      .update(memberships)
      .set({ status: 'active', role: invitation.role })
      .where(eq(memberships.id, existingMembership.id));
  }

  // Mark invitation as accepted
  await db
    .update(invitations)
    .set({ status: INVITATION_STATUS.ACCEPTED })
    .where(eq(invitations.id, invitation.id));

  // Audit log
  await db.insert(auditLogs).values({
    userId,
    organisationId: invitation.organisationId,
    action: 'accept_invitation',
    entityType: 'invitation',
    entityId: invitation.id,
    changes: { after: { role: invitation.role } },
  });

  revalidatePath('/dashboard');

  return { success: true, data: { orgSlug: org.slug } };
}

// ---------------------------------------------------------------------------
// Action: revokeInvitation
// ---------------------------------------------------------------------------

/**
 * Revokes a pending invitation. Requires admin+ role.
 */
export async function revokeInvitation(
  invitationId: string,
): Promise<ActionResult<void>> {
  const { userId, orgId } = await requirePermission(
    'manage',
    'users',
  ).catch(() => {
    throw new UnauthorizedError();
  });

  // Fetch the invitation
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    return { success: false, error: 'Invitation not found' };
  }

  // Ensure it belongs to the current org
  if (invitation.organisationId !== orgId) {
    return { success: false, error: 'Access denied' };
  }

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    return {
      success: false,
      error: 'Only pending invitations can be revoked',
    };
  }

  await db
    .update(invitations)
    .set({ status: INVITATION_STATUS.REVOKED })
    .where(eq(invitations.id, invitationId));

  // Audit log
  await db.insert(auditLogs).values({
    userId,
    organisationId: orgId,
    action: 'revoke_invitation',
    entityType: 'invitation',
    entityId: invitationId,
    changes: { after: { status: 'revoked' } },
  });

  // Fetch org slug for revalidation
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (org) {
    revalidatePath(`/${org.slug}/settings/team`);
  }

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Action: changeMemberRole
// ---------------------------------------------------------------------------

/**
 * Changes a team member's role. Requires admin+ role.
 * Cannot change the owner's role.
 */
export async function changeMemberRole(
  data: { memberId: string; role: string },
): Promise<ActionResult<void>> {
  const { userId, orgId } = await requirePermission(
    'manage',
    'users',
  ).catch(() => {
    throw new UnauthorizedError();
  });

  const parsed = changeMemberRoleSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { success: false, error: firstError.message };
  }

  const { memberId, role } = parsed.data;

  // Fetch the membership
  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.id, memberId),
        eq(memberships.organisationId, orgId),
      ),
    )
    .limit(1);

  if (!membership) {
    return { success: false, error: 'Member not found' };
  }

  // Cannot change the owner's role
  if (membership.role === 'owner') {
    return {
      success: false,
      error: 'Cannot change the owner\'s role. Transfer ownership first.',
    };
  }

  // Cannot set someone to owner via this action
  if (role === 'owner') {
    return {
      success: false,
      error: 'Cannot assign owner role. Use ownership transfer instead.',
    };
  }

  const previousRole = membership.role;

  await db
    .update(memberships)
    .set({ role: role as Role })
    .where(eq(memberships.id, memberId));

  // Audit log
  await db.insert(auditLogs).values({
    userId,
    organisationId: orgId,
    action: 'update',
    entityType: 'membership',
    entityId: memberId,
    changes: { before: { role: previousRole }, after: { role } },
  });

  // Fetch org slug for revalidation
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (org) {
    revalidatePath(`/${org.slug}/settings/team`);
  }

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Action: removeMember
// ---------------------------------------------------------------------------

/**
 * Removes a team member from the organisation. Requires admin+ role.
 * Owners cannot remove themselves.
 */
export async function removeMember(
  memberId: string,
): Promise<ActionResult<void>> {
  const { userId, orgId } = await requirePermission(
    'delete',
    'users',
  ).catch(() => {
    throw new UnauthorizedError();
  });

  // Fetch the membership
  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.id, memberId),
        eq(memberships.organisationId, orgId),
      ),
    )
    .limit(1);

  if (!membership) {
    return { success: false, error: 'Member not found' };
  }

  // Cannot remove the owner
  if (membership.role === 'owner') {
    return {
      success: false,
      error: 'Cannot remove the owner. Transfer ownership first.',
    };
  }

  // Cannot remove yourself if you're the owner
  if (membership.userId === userId) {
    // Check if current user is the owner
    const [selfMembership] = await db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.organisationId, orgId),
        ),
      )
      .limit(1);

    if (selfMembership?.role === 'owner') {
      return {
        success: false,
        error: 'Owners cannot remove themselves. Transfer ownership first.',
      };
    }
  }

  await db
    .delete(memberships)
    .where(eq(memberships.id, memberId));

  // Audit log
  await db.insert(auditLogs).values({
    userId,
    organisationId: orgId,
    action: 'delete',
    entityType: 'membership',
    entityId: memberId,
    changes: { before: { userId: membership.userId, role: membership.role } },
  });

  // Fetch org slug for revalidation
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (org) {
    revalidatePath(`/${org.slug}/settings/team`);
  }

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Query: getOrgMembers
// ---------------------------------------------------------------------------

export type OrgMember = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  joinedAt: Date;
};

/**
 * Lists all active members of the current user's active organisation.
 */
export async function getOrgMembers(): Promise<OrgMember[]> {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return [];
  }

  const rows = await db
    .select({
      membershipId: memberships.id,
      userId: memberships.userId,
      name: users.name,
      email: users.email,
      role: memberships.role,
      status: memberships.status,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.organisationId, session.user.activeOrgId),
        eq(memberships.status, 'active'),
      ),
    );

  return rows.map((r) => ({
    ...r,
    role: r.role as Role,
  }));
}

// ---------------------------------------------------------------------------
// Query: getOrgInvitations
// ---------------------------------------------------------------------------

export type OrgInvitation = {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  inviterName: string;
};

/**
 * Lists all invitations for the current user's active organisation.
 */
export async function getOrgInvitations(): Promise<OrgInvitation[]> {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return [];
  }

  const rows = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
      inviterName: users.name,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.invitedBy, users.id))
    .where(eq(invitations.organisationId, session.user.activeOrgId));

  return rows.map((r) => ({
    ...r,
    role: r.role as Role,
  }));
}

// ---------------------------------------------------------------------------
// Query: getInvitationByToken (public — no auth required)
// ---------------------------------------------------------------------------

export type InvitationDetails = {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: Date;
  orgName: string;
  orgSlug: string;
  inviterName: string;
};

/**
 * Looks up an invitation by its token. Used on the accept-invitation page.
 * No authentication required.
 */
export async function getInvitationByToken(
  token: string,
): Promise<InvitationDetails | null> {
  const [row] = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      orgName: organisations.name,
      orgSlug: organisations.slug,
      inviterName: users.name,
    })
    .from(invitations)
    .innerJoin(organisations, eq(invitations.organisationId, organisations.id))
    .innerJoin(users, eq(invitations.invitedBy, users.id))
    .where(eq(invitations.token, token))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    role: row.role as Role,
  };
}

// ---------------------------------------------------------------------------
// Query: getOrgSettings
// ---------------------------------------------------------------------------

export type OrgSettings = {
  id: string;
  name: string;
  slug: string;
  orgType: string | null;
  domains: string[];
  plan: string;
};

/**
 * Fetches the current user's active organisation settings.
 */
export async function getOrgSettings(): Promise<OrgSettings | null> {
  const session = await auth();
  if (!session?.user?.activeOrgId) return null;

  const [org] = await db
    .select({
      id: organisations.id,
      name: organisations.name,
      slug: organisations.slug,
      orgType: organisations.orgType,
      domains: organisations.domains,
      plan: organisations.plan,
    })
    .from(organisations)
    .where(eq(organisations.id, session.user.activeOrgId))
    .limit(1);

  return org ?? null;
}
