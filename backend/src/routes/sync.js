import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { syncUser } from "../services/sync.js";

const router = Router();

router.post("/sync", requireAuth, async (req, res) => {
  try {
    const summary = await syncUser(req.session.userId);
    res.json({ ok: true, summary });
  } catch (err) {
    console.error("Sync failed:", err);
    res.status(500).json({ error: "Sync failed", detail: err.message });
  }
});

export default router;
