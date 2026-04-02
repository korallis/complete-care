'use server';

import { db } from '@/lib/db';
import { familyPortalSettings } from '@/lib/db/schema/family-portal';
import { eq } from 'drizzle-orm';

/**
 * Get or create family portal settings for an organisation.
 */
export async function getPortalSettings(organisationId: string) {
  const [existing] = await db
    .select()
    .from(familyPortalSettings)
    .where(eq(familyPortalSettings.organisationId, organisationId))
    .limit(1);

  if (existing) {
    return { success: true as const, data: existing };
  }

  // Create default settings
  const [created] = await db
    .insert(familyPortalSettings)
    .values({ organisationId })
    .returning();

  return { success: true as const, data: created };
}

/**
 * Update family portal settings for an organisation.
 */
export async function updatePortalSettings(
  organisationId: string,
  settings: {
    messageApprovalRequired?: boolean;
    updateApprovalRequired?: boolean;
    visibleSections?: string[];
    invitationExpiryHours?: string;
  },
) {
  // Ensure settings record exists
  await getPortalSettings(organisationId);

  const [updated] = await db
    .update(familyPortalSettings)
    .set({
      ...settings,
      updatedAt: new Date(),
    })
    .where(eq(familyPortalSettings.organisationId, organisationId))
    .returning();

  return { success: true as const, data: updated };
}
