import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import authRoutes from "./routes/auth.js";
import syncRoutes from "./routes/sync.js";
import dashboardRoutes from "./routes/dashboard.js";
import reportsRoutes from "./routes/reports.js";
import { startCronJobs } from "./lib/cron.js";

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";
console.log("[DEBUG] isProduction at startup:", isProduction);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.use(
  cookieSession({
    name: "devtrack_session",
    secret: process.env.SESSION_SECRET,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  }),
);

app.use("/auth", authRoutes);
app.use("/api", syncRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", reportsRoutes);

app.get("/", (req, res) => {
  res.json({ status: "DevTrack backend running" });
});

startCronJobs();

app.listen(PORT, () => {
  console.log(`DevTrack backend listening on http://localhost:${PORT}`);
});
