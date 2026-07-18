import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";

import sessionRoutes from "./routes/sessionRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { registerSocketHandlers } from "./socket/index.js";

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, time: Date.now() }));
app.use("/api/session", sessionRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/facility", facilityRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
});

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`TrackMate server listening on http://localhost:${PORT}`);
});
