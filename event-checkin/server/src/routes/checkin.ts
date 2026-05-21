import { Router } from "express";
import { checkInCustomer } from "../services/sheetsService";

const checkinRouter = Router();

checkinRouter.post("/", async (req, res) => {
  const { row } = req.body as { row?: number };

  if (!row || !Number.isInteger(row)) {
    return res.status(400).json({ error: "invalid_row" });
  }

  try {
    const result = await checkInCustomer(row);
    if (result.alreadyCheckedIn) {
      return res.status(409).json({ error: "already_checked_in" });
    }
    return res.json({ success: true, timestamp: result.timestamp });
  } catch (error) {
    console.error("checkin failed", error);
    return res.status(503).json({ error: "sheets_error" });
  }
});

export default checkinRouter;
