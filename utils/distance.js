const EARTH_RADIUS_M = 6371000;
const AVERAGE_WALK_SPEED_MPS = 1.4; // ~5 km/h

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Returns distance in meters between two lat/lng points. */
export function haversineDistance(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

/** Rough walking ETA in seconds given a straight-line distance in meters. */
export function estimateWalkingSeconds(distanceMeters) {
  return Math.round(distanceMeters / AVERAGE_WALK_SPEED_MPS);
}
