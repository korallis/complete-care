'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building,
  Users,
  FileText,
  Wrench,
  Edit,
  Phone,
  MapPin,
} from 'lucide-react';
import type { Property } from '@/lib/db/schema/properties';
import type { TenancyListItem } from '@/features/properties/actions';
import type { PropertyDocument, MaintenanceRequest } from '@/lib/db/schema/properties';
import {
  PROPERTY_TYPE_LABELS,
  TENANCY_TYPE_LABELS,
  PROPERTY_DOCUMENT_TYPE_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  formatAddress,
  isDocumentExpired,
  isDocumentExpiringSoon,
  type PropertyType,
  type TenancyType,
  type PropertyDocumentType,
  type MaintenancePriority,
  type MaintenanceStatus,
} from '@/features/properties/constants';
import { cn } from '@/lib/utils';

type PropertyDetailProps = {
  property: Property;
  tenancies: TenancyListItem[];
  documents: PropertyDocument[];
  maintenanceRequests: MaintenanceRequest[];
  orgSlug: string;
  canEdit: boolean;
};

type TabKey = 'tenants' | 'documents' | 'maintenance' | 'communal';

export function PropertyDetail({
  property,
  tenancies,
  documents,
  maintenanceRequests,
  orgSlug,
  canEdit,
}: PropertyDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('tenants');

  const address = property.address as {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
  };
  const communalAreas = (property.communalAreas ?? []) as Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  const activeTenancies = tenancies.filter((t) => t.status === 'active');
  const occupancy = activeTenancies.length;
  const vacancies = Math.max(0, property.capacity - occupancy);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'tenants', label: 'Tenants', count: tenancies.length },
    { key: 'documents', label: 'Documents', count: documents.length },
    { key: 'maintenance', label: 'Maintenance', count: maintenanceRequests.length },
    ...(communalAreas.length > 0
      ? [{ key: 'communal' as TabKey, label: 'Communal Areas', count: communalAreas.length }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{address.line1}</h1>
          <p className="text-muted-foreground">
            {formatAddress(address)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={property.status === 'active' ? 'default' : 'secondary'}
          >
            {property.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/${orgSlug}/properties/${property.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Type</span>
            </div>
            <p className="text-lg font-semibold">
              {PROPERTY_TYPE_LABELS[property.propertyType as PropertyType] ??
                property.propertyType}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Occupancy</span>
            </div>
            <p className="text-lg font-semibold">
              {occupancy}/{property.capacity}
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  vacancies === 0
                    ? 'bg-destructive'
                    : occupancy / property.capacity >= 0.75
                      ? 'bg-amber-500'
                      : 'bg-primary'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((occupancy / property.capacity) * 100))}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Vacancies</span>
            </div>
            <p className="text-lg font-semibold">{vacancies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Landlord</span>
            </div>
            <p className="text-sm font-medium truncate">
              {property.landlordName || 'Not set'}
            </p>
            {property.landlordContact && (
              <p className="text-xs text-muted-foreground truncate">
                {property.landlordContact}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tab navigation */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-1 pb-3 text-sm font-medium transition-colors border-b-2',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {tenancies.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tenancies recorded for this property.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tenancies.map((tenancy) => (
                <Card key={tenancy.id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tenancy.personName}</p>
                      <p className="text-sm text-muted-foreground">
                        {TENANCY_TYPE_LABELS[tenancy.tenancyType as TenancyType] ??
                          tenancy.tenancyType}{' '}
                        &middot; From {tenancy.startDate}
                        {tenancy.endDate && ` to ${tenancy.endDate}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        tenancy.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {tenancy.status === 'active' ? 'Active' : 'Ended'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No documents uploaded for this property.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const expired = isDocumentExpired(doc.expiryDate);
                const expiringSoon = isDocumentExpiringSoon(doc.expiryDate);
                return (
                  <Card key={doc.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {PROPERTY_DOCUMENT_TYPE_LABELS[
                              doc.documentType as PropertyDocumentType
                            ] ?? doc.documentType}
                            {doc.expiryDate && ` \u00b7 Expires ${doc.expiryDate}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expired && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                        {!expired && expiringSoon && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Expiring soon
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          {maintenanceRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No maintenance requests for this property.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {maintenanceRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{req.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {req.description
                            ? req.description.slice(0, 80) +
                              (req.description.length > 80 ? '...' : '')
                            : 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          req.priority === 'urgent' || req.priority === 'high'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {MAINTENANCE_PRIORITY_LABELS[
                          req.priority as MaintenancePriority
                        ] ?? req.priority}
                      </Badge>
                      <Badge
                        variant={
                          req.status === 'completed'
                            ? 'default'
                            : req.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {MAINTENANCE_STATUS_LABELS[
                          req.status as MaintenanceStatus
                        ] ?? req.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'communal' && communalAreas.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-3">
            {communalAreas.map((area) => (
              <Card key={area.id}>
                <CardContent className="py-4">
                  <p className="font-medium">{area.name}</p>
                  {area.description && (
                    <p className="text-sm text-muted-foreground">
                      {area.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
