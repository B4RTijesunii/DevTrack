import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getGoalsWithProgress,
  createGoal,
  deleteGoal,
} from "../services/goals.js";

const router = Router();

router.get("/goals", requireAuth, async (req, res) => {
  try {
    const goals = await getGoalsWithProgress(req.session.userId);
    res.json({ goals });
  } catch (err) {
    console.error("Failed to load goals:", err);
    res
      .status(500)
      .json({ error: "Failed to load goals", detail: err.message });
  }
});

router.post("/goals", requireAuth, async (req, res) => {
  try {
    const { type, target, period } = req.body;
    const goal = await createGoal(req.session.userId, {
      type,
      target: Number(target),
      period,
    });
    res.json({ ok: true, goal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/goals/:id", requireAuth, async (req, res) => {
  try {
    await deleteGoal(req.session.userId, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
