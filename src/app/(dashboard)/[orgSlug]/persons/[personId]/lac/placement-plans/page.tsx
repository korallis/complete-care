/**
 * Placement Plans Page — lists all placement plans for a child
 * with overdue indicators and status tracking.
 */

import { notFound } from 'next/navigation';
import { listPlacementPlans } from '@/features/lac/actions';
import { PlacementPlanList } from '@/components/lac/placement-plan-list';
import { hasPermission } from '@/lib/rbac';
import { requirePermission } from '@/lib/rbac';
import { db } from '@/lib/db';
import { persons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Props = {
  params: Promise<{ orgSlug: string; personId: string }>;
};

export default async function PlacementPlansPage({ params }: Props) {
  const { orgSlug, personId } = await params;

  const { role } = await requirePermission('read', 'ofsted');

  // Fetch person name
  const [person] = await db
    .select({ fullName: persons.fullName })
    .from(persons)
    .where(eq(persons.id, personId))
    .limit(1);

  if (!person) notFound();

  const plans = await listPlacementPlans(personId);
  const canManage = hasPermission(role, 'manage', 'ofsted');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)]">
          Placement Plans
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
          Placement plan management for {person.fullName}
        </p>
      </div>

      <PlacementPlanList
        plans={plans}
        orgSlug={orgSlug}
        personId={personId}
        canCreate={canManage}
      />
    </div>
  );
}
