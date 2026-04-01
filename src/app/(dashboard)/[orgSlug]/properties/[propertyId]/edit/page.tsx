import { notFound } from 'next/navigation';
import { getProperty } from '@/features/properties/actions';
import { requirePermission } from '@/lib/rbac';
import { PropertyForm } from '@/components/properties/property-form';

export const metadata = {
  title: 'Edit Property',
};

type Props = {
  params: Promise<{ orgSlug: string; propertyId: string }>;
};

export default async function EditPropertyPage({ params }: Props) {
  const { orgSlug, propertyId } = await params;
  await requirePermission('update', 'properties');

  const property = await getProperty(propertyId);
  if (!property) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
        <p className="text-muted-foreground">
          Update property details and landlord information.
        </p>
      </div>

      <PropertyForm orgSlug={orgSlug} property={property} />
    </div>
  );
}
