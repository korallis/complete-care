import { requirePermission } from '@/lib/rbac';
import { PropertyForm } from '@/components/properties/property-form';

export const metadata = {
  title: 'Add Property',
};

type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function NewPropertyPage({ params }: Props) {
  const { orgSlug } = await params;
  await requirePermission('create', 'properties');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Property</h1>
        <p className="text-muted-foreground">
          Register a new property in your portfolio.
        </p>
      </div>

      <PropertyForm orgSlug={orgSlug} />
    </div>
  );
}
