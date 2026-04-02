/**
 * Geofencing — Pure Functions
 *
 * Haversine distance calculation and geofence checking.
 * No DB calls, no side effects — safe for use in tests, client, and server.
 */

import { EARTH_RADIUS_METRES } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Coordinates = {
  lat: number;
  lng: number;
};

export type GeofenceResult = {
  /** Distance in metres between the two points */
  distance: number;
  /** Whether the point is within the geofence radius */
  isWithinGeofence: boolean;
};

// ---------------------------------------------------------------------------
// Haversine distance calculation
// ---------------------------------------------------------------------------

/**
 * Convert degrees to radians.
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 *
 * @param pointA - First coordinate (lat/lng in degrees)
 * @param pointB - Second coordinate (lat/lng in degrees)
 * @returns Distance in metres
 */
export function calculateDistance(
  pointA: Coordinates,
  pointB: Coordinates,
): number {
  const dLat = degreesToRadians(pointB.lat - pointA.lat);
  const dLng = degreesToRadians(pointB.lng - pointA.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(pointA.lat)) *
      Math.cos(degreesToRadians(pointB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METRES * c;
}

/**
 * Check whether a point is within a geofence radius of a target location.
 *
 * @param carerLocation - The carer's current GPS coordinates
 * @param clientLocation - The client's registered location
 * @param radiusMetres - The geofence radius in metres
 * @returns GeofenceResult with distance and within-geofence flag
 */
export function checkGeofence(
  carerLocation: Coordinates,
  clientLocation: Coordinates,
  radiusMetres: number,
): GeofenceResult {
  const distance = calculateDistance(carerLocation, clientLocation);
  return {
    distance: Math.round(distance * 100) / 100,
    isWithinGeofence: distance <= radiusMetres,
  };
}
