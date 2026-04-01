'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, TrendingUp } from 'lucide-react';
import type { OccupancyDashboardResult } from '@/features/properties/actions';
import {
  PROPERTY_TYPE_LABELS,
  type PropertyType,
} from '@/features/properties/constants';

type OccupancyDashboardProps = {
  data: OccupancyDashboardResult;
};

export function OccupancyDashboard({ data }: OccupancyDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Properties</span>
            </div>
            <p className="text-2xl font-bold">{data.properties.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Total Capacity
              </span>
            </div>
            <p className="text-2xl font-bold">{data.totalCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Occupied</span>
            </div>
            <p className="text-2xl font-bold">{data.totalOccupied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Occupancy Rate
              </span>
            </div>
            <p className="text-2xl font-bold">
              {data.overallOccupancyPercent}%
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  data.overallOccupancyPercent === 100
                    ? 'bg-destructive'
                    : data.overallOccupancyPercent >= 75
                      ? 'bg-amber-500'
                      : 'bg-primary'
                }`}
                style={{
                  width: `${Math.min(100, data.overallOccupancyPercent)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-property breakdown */}
      {data.properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Occupancy by Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.properties.map((p) => {
                const address = p.address as {
                  line1: string;
                  line2?: string;
                  city: string;
                  county?: string;
                  postcode: string;
                };
                return (
                  <div key={p.propertyId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{address.line1}</p>
                        <p className="text-xs text-muted-foreground">
                          {PROPERTY_TYPE_LABELS[p.propertyType as PropertyType] ??
                            p.propertyType}{' '}
                          &middot; {address.city}, {address.postcode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {p.occupied}/{p.capacity}
                        </span>
                        {p.vacancies > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {p.vacancies}{' '}
                            {p.vacancies === 1 ? 'vacancy' : 'vacancies'}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Full
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          p.occupancyPercent === 100
                            ? 'bg-destructive'
                            : p.occupancyPercent >= 75
                              ? 'bg-amber-500'
                              : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, p.occupancyPercent)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
