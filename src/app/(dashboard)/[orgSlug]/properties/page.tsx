import { listProperties, getOccupancyDashboard } from '@/features/properties/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { requirePermission } from '@/lib/rbac';
import { PropertyList } from '@/components/properties/property-list';
import { OccupancyDashboard } from '@/components/properties/occupancy-dashboard';

export const metadata = {
  title: 'Properties',
};

type Props = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertiesPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const filters = await searchParams;
  const { role } = await requirePermission('read', 'properties');

  const canCreate = hasPermission(role, 'create', 'properties');

  const [propertyResult, occupancyData] = await Promise.all([
    listProperties(filters),
    getOccupancyDashboard(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
        <p className="text-muted-foreground">
          Manage your property register and tenancy occupancy.
        </p>
      </div>

      <OccupancyDashboard data={occupancyData} />

      <PropertyList
        properties={propertyResult.properties}
        orgSlug={orgSlug}
        canCreate={canCreate}
        totalCount={propertyResult.totalCount}
      />
    </div>
  );
}
