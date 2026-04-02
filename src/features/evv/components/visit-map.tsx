'use client';

import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VISIT_STATUS_CONFIG, type VisitStatus } from '../constants';

interface MapVisit {
  id: string;
  clientName: string;
  carerName: string;
  clientAddress: string;
  status: VisitStatus;
  expectedLatitude: number;
  expectedLongitude: number;
}

interface VisitMapProps {
  visits: MapVisit[];
  className?: string;
}

/**
 * Map placeholder component for EVV field dashboard.
 * Renders a styled container with visit markers positioned proportionally.
 * Replace with Google Maps / Mapbox integration in production.
 */
export function VisitMap({ visits, className }: VisitMapProps) {
  // Compute bounding box for proportional marker placement
  const lats = visits.map((v) => v.expectedLatitude);
  const lons = visits.map((v) => v.expectedLongitude);
  const minLat = Math.min(...(lats.length ? lats : [51.5]));
  const maxLat = Math.max(...(lats.length ? lats : [51.6]));
  const minLon = Math.min(...(lons.length ? lons : [-0.2]));
  const maxLon = Math.max(...(lons.length ? lons : [0.0]));

  const latRange = maxLat - minLat || 0.01;
  const lonRange = maxLon - minLon || 0.01;

  function getPosition(lat: number, lon: number) {
    // Map GPS coordinates to percentage positions, with 10% padding
    const x = 10 + ((lon - minLon) / lonRange) * 80;
    const y = 10 + ((maxLat - lat) / latRange) * 80; // invert Y axis
    return { x: `${x}%`, y: `${y}%` };
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-slate-50',
        className,
      )}
    >
      {/* Grid lines for map feel */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="evv-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#evv-grid)" />
        </svg>
      </div>

      {/* Map placeholder label */}
      {visits.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="mx-auto h-8 w-8 opacity-30" />
            <p className="mt-2 text-sm">No active visits to display</p>
          </div>
        </div>
      )}

      {/* Visit markers */}
      {visits.map((visit) => {
        const pos = getPosition(visit.expectedLatitude, visit.expectedLongitude);
        const statusConfig = VISIT_STATUS_CONFIG[visit.status];

        return (
          <div
            key={visit.id}
            className="group absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: pos.x, top: pos.y }}
          >
            {/* Marker pin */}
            <div className="relative">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125',
                  statusConfig.dotColour,
                )}
              >
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              {/* Pulse ring for active visits */}
              {(visit.status === 'in_progress' ||
                visit.status === 'scheduled') && (
                <span
                  className={cn(
                    'absolute inset-0 animate-ping rounded-full opacity-30',
                    statusConfig.dotColour,
                  )}
                />
              )}
            </div>

            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
              <p className="font-medium text-foreground">{visit.clientName}</p>
              <p className="text-muted-foreground">{visit.carerName}</p>
              <p className="mt-1 text-muted-foreground">{visit.clientAddress}</p>
              <span
                className={cn(
                  'mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                  statusConfig.colour,
                )}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Google Maps integration note */}
      <div className="absolute bottom-2 right-2 rounded bg-black/5 px-2 py-1 text-[10px] text-muted-foreground">
        Map placeholder — integrate Google Maps API
      </div>
    </div>
  );
}
