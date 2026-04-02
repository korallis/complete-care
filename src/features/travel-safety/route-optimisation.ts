/**
 * Route optimisation — placeholder module for suggesting efficient visit orderings.
 *
 * Current implementation uses a simple nearest-neighbour heuristic based on
 * Haversine distance. A production integration would call a routing API
 * (Google Directions, Mapbox Optimisation) for road-distance-based ordering.
 */

interface VisitLocation {
  visitId: string;
  latitude: number;
  longitude: number;
}

interface RouteSuggestionResult {
  orderedVisitIds: string[];
  totalEstimatedMiles: number;
}

/**
 * Haversine distance between two GPS coordinates in miles.
 */
function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Simple nearest-neighbour route optimisation.
 * Starts from the first visit and greedily picks the closest unvisited location.
 *
 * @param startLat - Carer's starting latitude (e.g. home or office)
 * @param startLon - Carer's starting longitude
 * @param visits - Array of visit locations to optimise
 * @returns Ordered visit IDs and estimated total distance
 */
export function suggestOptimalRoute(
  startLat: number,
  startLon: number,
  visits: VisitLocation[],
): RouteSuggestionResult {
  if (visits.length === 0) {
    return { orderedVisitIds: [], totalEstimatedMiles: 0 };
  }

  if (visits.length === 1) {
    const dist = haversineDistanceMiles(
      startLat,
      startLon,
      visits[0].latitude,
      visits[0].longitude,
    );
    return {
      orderedVisitIds: [visits[0].visitId],
      totalEstimatedMiles: Math.round(dist * 10) / 10,
    };
  }

  const remaining = [...visits];
  const ordered: VisitLocation[] = [];
  let totalDistance = 0;
  let currentLat = startLat;
  let currentLon = startLon;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistanceMiles(
        currentLat,
        currentLon,
        remaining[i].latitude,
        remaining[i].longitude,
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    totalDistance += nearestDist;
    currentLat = nearest.latitude;
    currentLon = nearest.longitude;
  }

  return {
    orderedVisitIds: ordered.map((v) => v.visitId),
    totalEstimatedMiles: Math.round(totalDistance * 10) / 10,
  };
}

/**
 * Estimate travel time in minutes based on distance and average speed.
 * Placeholder — a real implementation would use a routing API for road times.
 */
export function estimateTravelMinutes(
  distanceMiles: number,
  averageSpeedMph: number = 25,
): number {
  if (distanceMiles <= 0 || averageSpeedMph <= 0) return 0;
  return Math.round((distanceMiles / averageSpeedMph) * 60);
}
