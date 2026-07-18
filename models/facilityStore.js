import { haversineDistance } from "../utils/distance.js";

/**
 * Crowdsourced station facility markers -- platforms, exits, ATMs, toilets,
 * food stalls, police booths, medical rooms, parking, lifts, escalators.
 *
 * Unlike TrackingSession (which is per-meetup and expires), facilities are
 * meant to persist and accumulate over time as users add and verify them --
 * this is the "map the station once, everyone benefits" data layer described
 * in the combined product vision. Structured the same way as models/store.js
 * so it's an equally easy swap to a real MongoDB collection later (a 2dsphere
 * index would replace the in-memory haversine filter in getNearbyFacilities).
 */

const facilities = new Map(); // id -> Facility

export const FACILITY_TYPES = [
  "platform",
  "exit",
  "atm",
  "toilet",
  "food_stall",
  "police_booth",
  "medical_room",
  "parking",
  "lift",
  "escalator",
  "water",
  "waiting_hall",
];

let nextId = 1;

export function addFacility({ type, label, lat, lng, addedBy }) {
  if (!FACILITY_TYPES.includes(type)) {
    throw Object.assign(new Error("Invalid facility type"), { status: 400 });
  }
  const id = `fac_${nextId++}`;
  const facility = {
    id,
    type,
    label: label?.trim() || defaultLabel(type),
    lat,
    lng,
    addedBy,
    verifiedCount: 1, // the person adding it implicitly confirms it
    verifiedBy: new Set([addedBy]),
    createdAt: Date.now(),
  };
  facilities.set(id, facility);
  return toPublic(facility);
}

export function verifyFacility(id, userId) {
  const facility = facilities.get(id);
  if (!facility) return null;
  if (!facility.verifiedBy.has(userId)) {
    facility.verifiedBy.add(userId);
    facility.verifiedCount += 1;
  }
  return toPublic(facility);
}

/**
 * Returns facilities within `radiusMeters` of the given point, closest first.
 * This is the crowdsourced-mapping equivalent of a geospatial "near" query.
 */
export function getNearbyFacilities(lat, lng, radiusMeters = 800) {
  const results = [];
  for (const facility of facilities.values()) {
    const distance = haversineDistance({ lat, lng }, { lat: facility.lat, lng: facility.lng });
    if (distance <= radiusMeters) {
      results.push({ ...toPublic(facility), distanceMeters: Math.round(distance) });
    }
  }
  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function toPublic(facility) {
  const { verifiedBy, ...rest } = facility;
  return rest;
}

const ACRONYM_LABELS = { atm: "ATM" };

function defaultLabel(type) {
  if (ACRONYM_LABELS[type]) return ACRONYM_LABELS[type];
  return type
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default { addFacility, verifyFacility, getNearbyFacilities, FACILITY_TYPES };
