/**
 * In-memory data store.
 *
 * This mirrors the MongoDB schema described in the project's design doc
 * (TrackingSession, LiveLocation, SessionHistory) so it is a drop-in swap
 * for Mongoose models later — the shape of each object matches what you'd
 * store in a real collection. Using memory here means the demo runs with
 * zero external dependencies (no Mongo Atlas connection string needed).
 *
 * To move to MongoDB: replace the Map operations below with Mongoose
 * calls of the same name (create/find/update/delete) and add a TTL index
 * on `expiresAt` for auto-cleanup instead of the setInterval sweep below.
 */

const sessions = new Map(); // code -> TrackingSession
const locations = new Map(); // `${code}:${userId}` -> LiveLocation
const history = []; // SessionHistory[]

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function createSession({ code, ownerId, mode = "friend" }) {
  const now = Date.now();
  const session = {
    code,
    ownerId,
    joinedUserIds: [],
    mode, // "friend" | "delivery" | "group"
    status: "active", // active | paused | ended | expired
    createdAt: now,
    expiresAt: now + DEFAULT_TTL_MS,
  };
  sessions.set(code, session);
  return session;
}

export function getSession(code) {
  const session = sessions.get(code);
  if (!session) return null;
  if (session.status === "active" && Date.now() > session.expiresAt) {
    session.status = "expired";
  }
  return session;
}

export function joinSession(code, userId) {
  const session = getSession(code);
  if (!session) return null;
  if (!session.joinedUserIds.includes(userId)) {
    session.joinedUserIds.push(userId);
  }
  return session;
}

export function setSessionStatus(code, status) {
  const session = sessions.get(code);
  if (!session) return null;
  session.status = status;
  return session;
}

export function extendSession(code, extraMs = DEFAULT_TTL_MS) {
  const session = sessions.get(code);
  if (!session) return null;
  session.expiresAt = Date.now() + extraMs;
  session.status = "active";
  return session;
}

export function endSession(code) {
  const session = sessions.get(code);
  if (!session) return null;
  session.status = "ended";
  history.push({
    userId: session.ownerId,
    sessionId: code,
    duration: Date.now() - session.createdAt,
    joinedUserIds: [...session.joinedUserIds],
    endedAt: Date.now(),
  });
  return session;
}

export function deleteSession(code) {
  sessions.delete(code);
  for (const key of locations.keys()) {
    if (key.startsWith(`${code}:`)) locations.delete(key);
  }
}

export function updateLocation(code, userId, { lat, lng, accuracy, speed }) {
  const key = `${code}:${userId}`;
  const entry = {
    userId,
    sessionId: code,
    location: { type: "Point", coordinates: [lng, lat] },
    accuracy: accuracy ?? null,
    speed: speed ?? null,
    updatedAt: Date.now(),
  };
  locations.set(key, entry);
  return entry;
}

export function getSessionLocations(code) {
  const result = [];
  for (const [key, value] of locations.entries()) {
    if (key.startsWith(`${code}:`)) result.push(value);
  }
  return result;
}

export function getHistoryForUser(userId) {
  return history.filter(
    (h) => h.userId === userId || h.joinedUserIds.includes(userId)
  );
}

// Sweep for expired sessions every 30s, mirrors what a Mongo TTL index
// would do automatically in production.
setInterval(() => {
  const now = Date.now();
  for (const [code, session] of sessions.entries()) {
    if (session.status === "active" && now > session.expiresAt) {
      session.status = "expired";
    }
    // Fully clean up sessions that have been ended/expired for 10+ minutes
    if (
      (session.status === "ended" || session.status === "expired") &&
      now - session.expiresAt > 10 * 60 * 1000
    ) {
      deleteSession(code);
    }
  }
}, 30 * 1000);

export default {
  createSession,
  getSession,
  joinSession,
  setSessionStatus,
  extendSession,
  endSession,
  deleteSession,
  updateLocation,
  getSessionLocations,
  getHistoryForUser,
};
