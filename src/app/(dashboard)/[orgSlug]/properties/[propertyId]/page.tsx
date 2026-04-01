import { notFound } from 'next/navigation';
import {
  getProperty,
  listTenancies,
  listPropertyDocuments,
  listMaintenanceRequests,
} from '@/features/properties/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { requirePermission } from '@/lib/rbac';
import { PropertyDetail } from '@/components/properties/property-detail';

export const metadata = {
  title: 'Property Details',
};

type Props = {
  params: Promise<{ orgSlug: string; propertyId: string }>;
};

export default async function PropertyDetailPage({ params }: Props) {
  const { orgSlug, propertyId } = await params;
  const { role } = await requirePermission('read', 'properties');

  const canEdit = hasPermission(role, 'update', 'properties');

  const property = await getProperty(propertyId);
  if (!property) notFound();

  const [tenanciesList, documents, maintenance] = await Promise.all([
    listTenancies(propertyId),
    listPropertyDocuments(propertyId),
    listMaintenanceRequests(propertyId),
  ]);

  return (
    <PropertyDetail
      property={property}
      tenancies={tenanciesList}
      documents={documents}
      maintenanceRequests={maintenance}
      orgSlug={orgSlug}
      canEdit={canEdit}
    />
  );
}
