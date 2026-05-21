import { Router } from "express";
import { getAllCustomers, getCheckinStats, searchCustomers } from "../services/sheetsService";

const searchRouter = Router();

searchRouter.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 1) {
    return res.json({ results: [] });
  }

  try {
    const customers = await getAllCustomers();
    const results = searchCustomers(customers, q);
    return res.json({ results });
  } catch (error) {
    console.error("search failed", error);
    return res.status(503).json({ error: "sheets_error" });
  }
});

searchRouter.get("/stats", async (_req, res) => {
  try {
    const stats = await getCheckinStats();
    return res.json(stats);
  } catch (error) {
    console.error("stats failed", error);
    return res.status(503).json({ error: "sheets_error" });
  }
});

export default searchRouter;
