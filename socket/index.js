import store from "../models/store.js";
import { haversineDistance, estimateWalkingSeconds } from "../utils/distance.js";

/**
 * Broadcasts the current pair/group distance + ETA to everyone in a room.
 */
function broadcastDistance(io, code) {
  const locs = store.getSessionLocations(code);
  if (locs.length < 2) return;

  // Simple case: distance between the two most recently updated users.
  const [a, b] = locs
    .slice()
    .sort((x, y) => y.updatedAt - x.updatedAt)
    .slice(0, 2);

  const pointA = { lat: a.location.coordinates[1], lng: a.location.coordinates[0] };
  const pointB = { lat: b.location.coordinates[1], lng: b.location.coordinates[0] };
  const distanceMeters = haversineDistance(pointA, pointB);
  const etaSeconds = estimateWalkingSeconds(distanceMeters);

  io.to(code).emit("distance-update", {
    distanceMeters: Math.round(distanceMeters),
    etaSeconds,
  });
}

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    // Each socket tracks which session/user it's bound to for cleanup.
    socket.data.code = null;
    socket.data.userId = null;

    socket.on("join-session", ({ code, userId }, ack) => {
      const session = store.getSession(code);

      // Server-side authorization: only sessions that actually exist and
      // are active can be joined. This is the check that matters — never
      // trust a client-side "I have the code" claim alone.
      if (!session || session.status !== "active") {
        return ack?.({ ok: false, error: "Invalid or expired code" });
      }
      if (
        session.ownerId !== userId &&
        !session.joinedUserIds.includes(userId)
      ) {
        return ack?.({ ok: false, error: "You have not joined this session" });
      }

      socket.join(code);
      socket.data.code = code;
      socket.data.userId = userId;

      socket.to(code).emit("user-connected", { userId });
      ack?.({ ok: true, session });
    });

    socket.on("update-location", ({ code, userId, lat, lng, accuracy, speed }) => {
      const session = store.getSession(code);
      if (!session || session.status !== "active") return;
      if (socket.data.code !== code || socket.data.userId !== userId) return; // must have joined first

      const entry = store.updateLocation(code, userId, { lat, lng, accuracy, speed });
      socket.to(code).emit("location-update", entry);
      broadcastDistance(io, code);
    });

    socket.on("pause-session", ({ code }) => {
      const session = store.setSessionStatus(code, "paused");
      if (session) io.to(code).emit("session-paused");
    });

    socket.on("resume-session", ({ code }) => {
      const session = store.extendSession(code);
      if (session) io.to(code).emit("session-resumed", { expiresAt: session.expiresAt });
    });

    socket.on("leave-session", ({ code, userId }) => {
      socket.leave(code);
      socket.to(code).emit("user-disconnected", { userId });
    });

    socket.on("end-session", ({ code }) => {
      const session = store.endSession(code);
      if (session) io.to(code).emit("session-ended");
    });

    socket.on("disconnect", () => {
      const { code, userId } = socket.data;
      if (code && userId) {
        socket.to(code).emit("user-disconnected", { userId });
      }
    });
  });

  // Warn rooms 30s before their session auto-expires.
  setInterval(() => {
    const now = Date.now();
    for (const room of io.sockets.adapter.rooms.keys()) {
      const session = store.getSession(room);
      if (!session || session.status !== "active") continue;
      const msLeft = session.expiresAt - now;
      if (msLeft > 0 && msLeft <= 30 * 1000) {
        io.to(room).emit("session-expiring-soon", { msLeft });
      } else if (msLeft <= 0) {
        io.to(room).emit("session-ended", { reason: "expired" });
      }
    }
  }, 5000);
}
