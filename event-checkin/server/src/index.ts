import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import session from "express-session";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth";
import searchRouter from "./routes/search";
import checkinRouter from "./routes/checkin";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const isProd = process.env.NODE_ENV === "production";

const allowedOrigin = process.env.CORS_ORIGIN;
const appBasePath = normalizeBasePath(process.env.APP_BASE_PATH);
const sessionCookieSameSite = normalizeSameSite(process.env.SESSION_COOKIE_SAMESITE);
const sessionCookieSecure = normalizeBoolean(process.env.SESSION_COOKIE_SECURE, isProd);

function normalizeBasePath(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw || raw === "/") {
    return "";
  }
  return `/${raw.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

function normalizeBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeSameSite(
  value: string | undefined
): "strict" | "lax" | "none" | boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "lax") {
    return "lax";
  }
  if (normalized === "none") {
    return "none";
  }
  if (normalized === "false") {
    return false;
  }
  return "strict";
}

if (isProd) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (!isProd) {
        return callback(null, true);
      }
      if (allowedOrigin && origin === allowedOrigin) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(
  session({
    name: "checkin.sid",
    secret: process.env.SESSION_SECRET || "insecure-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: sessionCookieSameSite,
      secure: sessionCookieSecure
    }
  })
);

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.loggedIn) {
    return res.status(401).json({ error: "unauthorized" });
  }
  return next();
}

const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/search", requireAuth, searchRouter);
apiRouter.use("/checkin", requireAuth, checkinRouter);

app.use("/api", apiRouter);
if (appBasePath) {
  app.use(`${appBasePath}/api`, apiRouter);
}

const clientDistPath = path.resolve(__dirname, "../../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

if (fs.existsSync(clientIndexPath)) {
  if (appBasePath) {
    app.use(appBasePath, express.static(clientDistPath));
    app.get(`${appBasePath}/*`, (req, res, next) => {
      if (req.path.startsWith(`${appBasePath}/api`)) {
        return next();
      }
      return res.sendFile(clientIndexPath);
    });
  } else {
    app.use(express.static(clientDistPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      return res.sendFile(clientIndexPath);
    });
  }
} else {
  console.log("client/dist not found. Running in API-only mode.");
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
