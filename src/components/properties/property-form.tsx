'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProperty, updateProperty } from '@/features/properties/actions';
import type { Property } from '@/lib/db/schema/properties';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
} from '@/features/properties/constants';
import type { PropertyType, PropertyStatus } from '@/features/properties/constants';

type PropertyFormProps = {
  orgSlug: string;
  property?: Property;
};

export function PropertyForm({ orgSlug, property }: PropertyFormProps) {
  const router = useRouter();
  const isEditing = !!property;

  const existingAddress = property?.address as {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
  } | undefined;

  const [line1, setLine1] = useState(existingAddress?.line1 ?? '');
  const [line2, setLine2] = useState(existingAddress?.line2 ?? '');
  const [city, setCity] = useState(existingAddress?.city ?? '');
  const [county, setCounty] = useState(existingAddress?.county ?? '');
  const [postcode, setPostcode] = useState(existingAddress?.postcode ?? '');
  const [landlordName, setLandlordName] = useState(property?.landlordName ?? '');
  const [landlordContact, setLandlordContact] = useState(property?.landlordContact ?? '');
  const [propertyType, setPropertyType] = useState<string>(
    property?.propertyType ?? 'shared_house',
  );
  const [capacity, setCapacity] = useState(String(property?.capacity ?? 1));
  const [status, setStatus] = useState<string>(property?.status ?? 'active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      address: {
        line1,
        line2: line2 || undefined,
        city,
        county: county || undefined,
        postcode,
      },
      landlordName: landlordName || null,
      landlordContact: landlordContact || null,
      propertyType: propertyType as PropertyType,
      capacity: parseInt(capacity, 10) || 1,
      communalAreas: (property?.communalAreas ?? []) as Array<{
        id: string;
        name: string;
        description?: string;
      }>,
      status: status as PropertyStatus,
    };

    try {
      const result = isEditing
        ? await updateProperty(property.id, input)
        : await createProperty(input);

      if (result.success) {
        toast.success(isEditing ? 'Property updated' : 'Property created');
        if (isEditing) {
          router.push(`/${orgSlug}/properties/${property.id}`);
        } else {
          router.push(`/${orgSlug}/properties`);
        }
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="line1">Address Line 1 *</Label>
            <Input
              id="line1"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              required
              placeholder="e.g. 42 Oak Avenue"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line2">Address Line 2</Label>
            <Input
              id="line2"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="e.g. Flat 2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 max-w-[200px]">
            <Label htmlFor="postcode">Postcode *</Label>
            <Input
              id="postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              required
              placeholder="e.g. SW1A 1AA"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type *</Label>
              <Select
                id="propertyType"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PROPERTY_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={100}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {PROPERTY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROPERTY_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Landlord Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="landlordName">Landlord Name</Label>
            <Input
              id="landlordName"
              value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)}
              placeholder="e.g. Acme Housing Ltd"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landlordContact">Landlord Contact</Label>
            <Input
              id="landlordContact"
              value={landlordContact}
              onChange={(e) => setLandlordContact(e.target.value)}
              placeholder="e.g. 020 1234 5678 or email"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save changes'
              : 'Create property'}
        </Button>
      </div>
    </form>
  );
}
