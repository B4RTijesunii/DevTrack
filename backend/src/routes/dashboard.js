import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getOverviewStats,
  getProjectsOverview,
  getAnalyticsStats,
} from "../services/stats.js";

const router = Router();

// GET /api/overview — everything the Overview dashboard renders
router.get("/overview", requireAuth, async (req, res) => {
  try {
    const stats = await getOverviewStats(req.session.userId);
    res.json(stats);
  } catch (err) {
    console.error("Failed to load overview stats:", err);
    res
      .status(500)
      .json({ error: "Failed to load overview stats", detail: err.message });
  }
});
// GET /api/projects — per-repo breakdown for the Projects page
router.get("/projects", requireAuth, async (req, res) => {
  try {
    const projects = await getProjectsOverview(req.session.userId);
    res.json({ projects });
  } catch (err) {
    console.error("Failed to load projects:", err);
    res
      .status(500)
      .json({ error: "Failed to load projects", detail: err.message });
  }
});

// GET /api/analytics — multi-week/month trends
router.get("/analytics", requireAuth, async (req, res) => {
  try {
    const analytics = await getAnalyticsStats(req.session.userId);
    res.json(analytics);
  } catch (err) {
    console.error("Failed to load analytics:", err);
    res
      .status(500)
      .json({ error: "Failed to load analytics", detail: err.message });
  }
});
export default router;
