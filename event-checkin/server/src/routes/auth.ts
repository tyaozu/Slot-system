import { Router } from "express";

const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password !== process.env.RECEPTION_PASSWORD) {
    return res.status(401).json({ success: false });
  }

  req.session.loggedIn = true;
  return res.json({ success: true });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("checkin.sid");
    res.json({ success: true });
  });
});

authRouter.get("/status", (req, res) => {
  res.json({ loggedIn: Boolean(req.session.loggedIn) });
});

export default authRouter;
