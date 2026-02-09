import express, { Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import rateLimiter from "express-rate-limit";
import "dotenv/config";
import path from "path";

import { setupMonitoring } from "./monitor.js";
import fullStatus, { setFullStatusFromHistory } from "./statusStorage.js";

const app = express();

// retrieves status from file to get something to show before the first check
await setFullStatusFromHistory();
setupMonitoring();
// console.log(fullStatus);

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
app.get(`/api/v1/maintenance/`, (req: Request, res: Response) => {
  const userToken = req.query.token as string;
  const secretToken = process.env.MAINTENANCE_TOKEN;

  if (!secretToken) return res.status(500).send("Для початку треба налаштувати токен на сервері.");
  if (!userToken || userToken !== secretToken)
    return res.status(403).send("Неправильний токен. Перевірте токен та спробуйте ще раз.");

  fullStatus.maintenance = !fullStatus.maintenance;
  setupMonitoring();

  let message: string = "";
  if (fullStatus.maintenance) message = "Режим технічних робіт активовано.";
  if (!fullStatus.maintenance)
    message = "Режим технічних робіт деактивовано, сервер працює в штатному режимі.";
  res.status(200).send(message);
});
app.get("/{*any}", (req: Request, res: Response) => {
  res.status(404).sendFile(path.resolve("./client/dist/index.html"));
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Server is listening on port: ${port}...`));
