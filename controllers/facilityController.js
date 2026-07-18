import facilityStore, { FACILITY_TYPES } from "../models/facilityStore.js";

export function addFacility(req, res) {
  const { type, label, lat, lng, userId } = req.body;

  if (!userId || typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "userId, lat, lng are required" });
  }
  if (!FACILITY_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${FACILITY_TYPES.join(", ")}` });
  }

  const facility = facilityStore.addFacility({ type, label, lat, lng, addedBy: userId });
  return res.status(201).json({ facility });
}

export function verifyFacility(req, res) {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const facility = facilityStore.verifyFacility(id, userId);
  if (!facility) return res.status(404).json({ error: "Facility not found" });
  return res.json({ facility });
}

export function getNearbyFacilities(req, res) {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = req.query.radius ? parseFloat(req.query.radius) : undefined;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: "lat and lng query params are required" });
  }

  const facilities = facilityStore.getNearbyFacilities(lat, lng, radius);
  return res.json({ facilities });
}

export function getFacilityTypes(_req, res) {
  return res.json({ types: FACILITY_TYPES });
}
