import store from "../models/store.js";

// Real-time updates go through Socket.IO (see socket/index.js). This REST
// endpoint exists as a fallback for clients/devices that can't hold a
// socket connection open (e.g. background delivery-partner pings).
export function updateLocation(req, res) {
  const { code } = req.params;
  const { userId, lat, lng, accuracy, speed } = req.body;

  if (!userId || typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "userId, lat, lng are required" });
  }

  const session = store.getSession(code);
  if (!session || session.status !== "active") {
    return res.status(410).json({ error: "Session is not active" });
  }

  const entry = store.updateLocation(code, userId, { lat, lng, accuracy, speed });
  return res.json({ location: entry });
}
