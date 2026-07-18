import { generateSessionCode } from "../utils/generateCode.js";
import store from "../models/store.js";

export function createSession(req, res) {
  const { userId, mode } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  let code;
  // Guarantee uniqueness even though collisions are astronomically unlikely.
  do {
    code = generateSessionCode();
  } while (store.getSession(code));

  const session = store.createSession({ code, ownerId: userId, mode });
  return res.status(201).json({ session });
}

export function joinSession(req, res) {
  const { code } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const session = store.getSession(code);
  if (!session) {
    return res.status(404).json({ error: "Invalid or unknown code" });
  }
  if (session.status !== "active") {
    return res
      .status(410)
      .json({ error: `Session is ${session.status}, it can no longer be joined` });
  }

  const updated = store.joinSession(code, userId);
  return res.json({ session: updated });
}

export function getSession(req, res) {
  const { code } = req.params;
  const session = store.getSession(code);
  if (!session) return res.status(404).json({ error: "Session not found" });
  return res.json({ session, locations: store.getSessionLocations(code) });
}

export function pauseSession(req, res) {
  const { code } = req.params;
  const session = store.setSessionStatus(code, "paused");
  if (!session) return res.status(404).json({ error: "Session not found" });
  return res.json({ session });
}

export function resumeSession(req, res) {
  const { code } = req.params;
  const session = store.extendSession(code);
  if (!session) return res.status(404).json({ error: "Session not found" });
  return res.json({ session });
}

export function endSession(req, res) {
  const { code } = req.params;
  const session = store.endSession(code);
  if (!session) return res.status(404).json({ error: "Session not found" });
  return res.json({ session });
}

export function getHistory(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  return res.json({ history: store.getHistoryForUser(userId) });
}
