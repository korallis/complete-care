/**
 * Geofencing utilities — Haversine distance calculation and geofence validation.
 * Used for EVV check-in/check-out GPS verification.
 */

/** Earth radius in metres */
const EARTH_RADIUS_M = 6_371_000;

/** Convert degrees to radians */
function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the Haversine distance between two GPS coordinates.
 * Returns distance in metres.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Check whether a point is within a circular geofence.
 *
 * @param checkLat - Check-in latitude
 * @param checkLon - Check-in longitude
 * @param fenceLat - Geofence centre latitude
 * @param fenceLon - Geofence centre longitude
 * @param radiusMetres - Geofence radius in metres
 * @returns Object with distance and whether the point is within the fence
 */
export function validateGeofence(
  checkLat: number,
  checkLon: number,
  fenceLat: number,
  fenceLon: number,
  radiusMetres: number,
): { distanceMetres: number; withinGeofence: boolean } {
  const distanceMetres = haversineDistance(
    checkLat,
    checkLon,
    fenceLat,
    fenceLon,
  );

  return {
    distanceMetres: Math.round(distanceMetres * 100) / 100,
    withinGeofence: distanceMetres <= radiusMetres,
  };
}

/**
 * Determine the visit timeliness status based on scheduled vs actual times.
 *
 * @param scheduledStart - The planned start time
 * @param actualStart - The actual start time (null if not started)
 * @param gracePeriodMinutes - Grace period in minutes
 * @returns 'on_time' | 'late' | 'missed' | 'not_started'
 */
export function getVisitTimeliness(
  scheduledStart: Date,
  actualStart: Date | null,
  gracePeriodMinutes: number,
): 'on_time' | 'late' | 'missed' | 'not_started' {
  if (!actualStart) {
    const now = new Date();
    const missedThreshold = new Date(
      scheduledStart.getTime() + gracePeriodMinutes * 2 * 60_000,
    );
    if (now > missedThreshold) return 'missed';
    if (now > new Date(scheduledStart.getTime() + gracePeriodMinutes * 60_000))
      return 'late';
    return 'not_started';
  }

  const diffMinutes =
    (actualStart.getTime() - scheduledStart.getTime()) / 60_000;

  if (diffMinutes <= gracePeriodMinutes) return 'on_time';
  return 'late';
}

/**
 * Calculate visit duration in minutes between two timestamps.
 */
export function calculateDurationMinutes(
  start: Date,
  end: Date,
): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}
