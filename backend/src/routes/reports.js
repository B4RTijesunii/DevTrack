import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  generateMonthlyReview,
  getLatestMonthlyReview,
  getAllMonthlyReviews,
} from "../services/monthlyReview.js";

const router = Router();

router.post("/reports/monthly", requireAuth, async (req, res) => {
  try {
    const summary = await generateMonthlyReview(req.session.userId);
    res.json({ ok: true, summary });
  } catch (err) {
    console.error("Failed to generate monthly review:", err);
    res.status(500).json({
      error: "Failed to generate monthly review",
      detail: err.message,
    });
  }
});

router.get("/reports/monthly", requireAuth, async (req, res) => {
  try {
    const summary = await getLatestMonthlyReview(req.session.userId);
    res.json({ summary });
  } catch (err) {
    console.error("Failed to fetch monthly review:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch monthly review", detail: err.message });
  }
});
// GET /api/reports/monthly/all — full archive of past monthly reviews
router.get("/reports/monthly/all", requireAuth, async (req, res) => {
  try {
    const reviews = await getAllMonthlyReviews(req.session.userId);
    res.json({ reviews });
  } catch (err) {
    console.error("Failed to fetch review history:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch review history", detail: err.message });
  }
});
export default router;
