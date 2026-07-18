import rateLimit from "express-rate-limit";

// Prevents brute-forcing session codes.
export const joinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many join attempts, please slow down." },
});

// Location pings are frequent by design (every 2-3s per active user),
// so this is generous but still bounds abuse.
export const locationLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many location updates." },
});
