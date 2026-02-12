import express, { Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import rateLimiter from "express-rate-limit";
import "dotenv/config";
import path from "path";

import { setupMonitoring } from "./monitor.js";
import fullStatus, { setFullStatusFromHistory } from "./statusStorage.js";
import { telegramBot } from "./services/telegram.js";
import statsRouter, { logVisits } from "./stats.js";
import maintenanceRouter from "./maintenance.js";

const app = express();

// retrieves status from file to get something to show before the first check
await setFullStatusFromHistory();
setupMonitoring();
// console.log(fullStatus);

// ----- SECURITY HEADERS START -----
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "upgrade-insecure-requests": [],
      },
    },
  }),
);
app.use(
  rateLimiter({
    windowMs: 10 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
// ----- SECURITY HEADERS END -----

// ----- LOG MIDDLEWARE START -----
app.use((req, res, next) => {
  const noLog: string[] = [".png", ".json", "/api", ".ico", ".css", ".js"];
  const shouldIgnore = req.method !== "GET" || noLog.some((part) => req.path.includes(part));
  if (shouldIgnore) {
    return next();
  }

  logVisits(req);
  next();
});
// ----- LOG MIDDLEWARE END -----

// ----- ROUTES START -----
app.use(compression());
app.use(express.static("./client/dist"));

app.get("/api/v1/status", (req: Request, res: Response) => {
  res.status(200).json({ fullStatus });
});
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/maintenance", maintenanceRouter);
app.get("/{*any}", (req: Request, res: Response) => {
  res.status(404).sendFile(path.resolve("./client/dist/index.html"));
});
// ----- ROUTES END -----

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server is listening on port: ${port}...`);
  if (process.env.NODE_ENV === "production") {
    telegramBot
      .start({
        onStart: (botInfo) => {
          console.log(`Telegram bot @${botInfo.username} is running...`);
        },
      })
      .catch((error) => {
        console.error(`Failed to start Telegram bot:`, error);
      });
  }
});
