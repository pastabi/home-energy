import express, { Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import rateLimiter from "express-rate-limit";
import "dotenv/config";
import path from "path";

import updateStatus from "./monitor.js";
import fullStatus, { setFullStatusFromHistory, updateSunData } from "./statusStorage.js";

const app = express();

// retrieves status from file to get something to show before the first check
await setFullStatusFromHistory();
updateSunData();
// console.log(fullStatus);

setInterval(async () => {
  await updateStatus();
}, 60000);

// ----- SECURITY HEADERS START -----
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
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

app.use(compression());
app.use(express.static("./client/dist"));

app.get("/api/v1/status", (req: Request, res: Response) => {
  res.status(200).json({ fullStatus });
});
app.get("/{*any}", (req: Request, res: Response) => {
  res.status(404).sendFile(path.resolve("./client/dist/index.html"));
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Server is listening on port: ${port}...`));
