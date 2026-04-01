'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Plus, Users } from 'lucide-react';
import type { PropertyListItem } from '@/features/properties/actions';
import {
  PROPERTY_TYPE_LABELS,
  type PropertyType,
} from '@/features/properties/constants';

type PropertyListProps = {
  properties: PropertyListItem[];
  orgSlug: string;
  canCreate: boolean;
  totalCount: number;
};

export function PropertyList({
  properties,
  orgSlug,
  canCreate,
  totalCount,
}: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No properties yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first property to start managing tenancies.
          </p>
          {canCreate && (
            <Button asChild>
              <Link href={`/${orgSlug}/properties/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add property
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'property' : 'properties'}
        </p>
        {canCreate && (
          <Button asChild size="sm">
            <Link href={`/${orgSlug}/properties/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Add property
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => {
          const address = property.address as {
            line1: string;
            line2?: string;
            city: string;
            county?: string;
            postcode: string;
          };
          const occupancy = property.activeTenancyCount;
          const vacancies = Math.max(0, property.capacity - occupancy);
          const occupancyPercent =
            property.capacity > 0
              ? Math.round((occupancy / property.capacity) * 100)
              : 0;

          return (
            <Link
              key={property.id}
              href={`/${orgSlug}/properties/${property.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base leading-tight">
                      {address.line1}
                    </CardTitle>
                    <Badge
                      variant={
                        property.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {property.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.postcode}
                  </p>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {PROPERTY_TYPE_LABELS[property.propertyType as PropertyType] ??
                        property.propertyType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {occupancy}/{property.capacity} occupied
                    </span>
                    {vacancies > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {vacancies} {vacancies === 1 ? 'vacancy' : 'vacancies'}
                      </Badge>
                    )}
                  </div>

                  {/* Occupancy bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        occupancyPercent === 100
                          ? 'bg-destructive'
                          : occupancyPercent >= 75
                            ? 'bg-amber-500'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                    />
                  </div>

                  {property.landlordName && (
                    <p className="text-xs text-muted-foreground">
                      Landlord: {property.landlordName}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
