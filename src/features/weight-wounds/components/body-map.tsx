'use client';

/**
 * Body map component for wound location marking. VAL-CLIN-012.
 * Renders a simplified SVG body outline with clickable regions
 * and displays existing wound markers.
 */
import { useState } from 'react';
import type { z } from 'zod';
import type { bodyMapRegion } from '../schema';

type BodyMapRegion = z.infer<typeof bodyMapRegion>;

interface WoundMarker {
  id: string;
  x: number;
  y: number;
  region: BodyMapRegion;
  label: string;
  status: string;
}

interface BodyMapProps {
  wounds?: WoundMarker[];
  onRegionClick?: (region: BodyMapRegion, x: number, y: number) => void;
  selectedRegion?: BodyMapRegion | null;
  interactive?: boolean;
}

/** Region hitbox definitions (percentage-based coordinates) */
const REGIONS: Array<{
  id: BodyMapRegion;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> = [
  { id: 'head', label: 'Head', x: 39, y: 0, width: 22, height: 10 },
  { id: 'neck', label: 'Neck', x: 42, y: 10, width: 16, height: 4 },
  { id: 'chest', label: 'Chest', x: 32, y: 14, width: 36, height: 12 },
  { id: 'abdomen', label: 'Abdomen', x: 34, y: 26, width: 32, height: 12 },
  { id: 'upper_back', label: 'Upper Back', x: 32, y: 14, width: 36, height: 12 },
  { id: 'lower_back', label: 'Lower Back', x: 34, y: 26, width: 32, height: 12 },
  { id: 'sacrum', label: 'Sacrum', x: 40, y: 38, width: 20, height: 6 },
  { id: 'left_arm', label: 'Left Arm', x: 16, y: 14, width: 14, height: 20 },
  { id: 'right_arm', label: 'Right Arm', x: 70, y: 14, width: 14, height: 20 },
  { id: 'left_hand', label: 'Left Hand', x: 12, y: 34, width: 10, height: 8 },
  { id: 'right_hand', label: 'Right Hand', x: 78, y: 34, width: 10, height: 8 },
  { id: 'left_hip', label: 'Left Hip', x: 30, y: 38, width: 12, height: 8 },
  { id: 'right_hip', label: 'Right Hip', x: 58, y: 38, width: 12, height: 8 },
  { id: 'left_thigh', label: 'Left Thigh', x: 30, y: 46, width: 14, height: 14 },
  { id: 'right_thigh', label: 'Right Thigh', x: 56, y: 46, width: 14, height: 14 },
  { id: 'left_knee', label: 'Left Knee', x: 32, y: 60, width: 10, height: 6 },
  { id: 'right_knee', label: 'Right Knee', x: 58, y: 60, width: 10, height: 6 },
  { id: 'left_lower_leg', label: 'Left Lower Leg', x: 31, y: 66, width: 12, height: 16 },
  { id: 'right_lower_leg', label: 'Right Lower Leg', x: 57, y: 66, width: 12, height: 16 },
  { id: 'left_foot', label: 'Left Foot', x: 28, y: 82, width: 14, height: 8 },
  { id: 'right_foot', label: 'Right Foot', x: 58, y: 82, width: 14, height: 8 },
  { id: 'left_heel', label: 'Left Heel', x: 30, y: 88, width: 10, height: 6 },
  { id: 'right_heel', label: 'Right Heel', x: 60, y: 88, width: 10, height: 6 },
];

const STATUS_COLOURS: Record<string, string> = {
  open: '#ef4444',
  healing: '#f59e0b',
  healed: '#22c55e',
  deteriorating: '#dc2626',
  referred: '#8b5cf6',
};

export function BodyMap({
  wounds = [],
  onRegionClick,
  selectedRegion,
  interactive = true,
}: BodyMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyMapRegion | null>(null);

  return (
    <div className="relative mx-auto" style={{ width: 280, height: 480 }}>
      {/* Simplified body outline */}
      <svg
        viewBox="0 0 100 96"
        className="h-full w-full"
        aria-label="Body map for wound location"
      >
        {/* Body outline */}
        <ellipse cx="50" cy="5" rx="8" ry="5" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        {/* Torso */}
        <rect x="35" y="10" width="30" height="30" rx="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        {/* Arms */}
        <rect x="20" y="12" width="14" height="24" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        <rect x="66" y="12" width="14" height="24" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        {/* Hands */}
        <ellipse cx="18" cy="38" rx="4" ry="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        <ellipse cx="82" cy="38" rx="4" ry="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        {/* Pelvis */}
        <rect x="34" y="40" width="32" height="8" rx="2" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        {/* Legs */}
        <rect x="34" y="48" width="12" height="30" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        <rect x="54" y="48" width="12" height="30" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        {/* Feet */}
        <ellipse cx="40" cy="82" rx="6" ry="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        <ellipse cx="60" cy="82" rx="6" ry="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />

        {/* Interactive region overlays */}
        {interactive &&
          REGIONS.map((region) => (
            <rect
              key={region.id}
              x={region.x}
              y={region.y}
              width={region.width}
              height={region.height}
              fill={
                selectedRegion === region.id
                  ? 'rgba(37, 99, 235, 0.2)'
                  : hoveredRegion === region.id
                    ? 'rgba(37, 99, 235, 0.1)'
                    : 'transparent'
              }
              stroke={
                selectedRegion === region.id
                  ? '#2563eb'
                  : hoveredRegion === region.id
                    ? '#93c5fd'
                    : 'transparent'
              }
              strokeWidth="0.5"
              rx="1"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() =>
                onRegionClick?.(
                  region.id,
                  region.x + region.width / 2,
                  region.y + region.height / 2,
                )
              }
            >
              <title>{region.label}</title>
            </rect>
          ))}

        {/* Wound markers */}
        {wounds.map((wound) => (
          <g key={wound.id}>
            <circle
              cx={wound.x}
              cy={wound.y}
              r="2"
              fill={STATUS_COLOURS[wound.status] ?? '#ef4444'}
              stroke="white"
              strokeWidth="0.5"
            />
            <title>
              {wound.label} ({wound.status})
            </title>
          </g>
        ))}
      </svg>

      {/* Region label tooltip */}
      {hoveredRegion && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-6 rounded bg-gray-900 px-2 py-1 text-xs text-white shadow">
          {REGIONS.find((r) => r.id === hoveredRegion)?.label}
        </div>
      )}
    </div>
  );
}

/** Get the label for a body map region */
export function getRegionLabel(region: BodyMapRegion): string {
  return REGIONS.find((r) => r.id === region)?.label ?? region;
}
