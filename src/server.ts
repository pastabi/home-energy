import express, { Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import rateLimiter from "express-rate-limit";
import "dotenv/config";
import path from "path";

import { setupMonitoring } from "./monitor.js";
import fullStatus, {
  deleteEntriesFromHistoryStorage,
  setFullStatusFromHistory,
} from "./statusStorage.js";
import { telegramBot } from "./services/telegram.js";

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

app.use(compression());
app.use(express.static("./client/dist"));

app.get("/api/v1/status", (req: Request, res: Response) => {
  res.status(200).json({ fullStatus });
});
app.get(`/api/v1/maintenance/`, async (req: Request, res: Response) => {
  const userToken = req.query.token as string;
  const deleteHistoryEntries = req.query.delete as string;
  const secretToken = process.env.MAINTENANCE_TOKEN;

  if (!secretToken) return res.status(500).send("Для початку треба налаштувати токен на сервері.");
  if (!userToken || userToken !== secretToken)
    return res.status(403).send("Неправильний токен. Перевірте токен та спробуйте ще раз.");

  let message: string = "";

  if (!deleteHistoryEntries) {
    fullStatus.maintenance = !fullStatus.maintenance;
    setupMonitoring();

    if (fullStatus.maintenance) message = "Режим технічних робіт активовано.";
    if (!fullStatus.maintenance)
      message = "Режим технічних робіт деактивовано, сервер працює в штатному режимі.";
  } else {
    const start = Number(deleteHistoryEntries.split(",").at(0));
    const count = Number(deleteHistoryEntries.split(",").at(1));
    if (isNaN(start) || isNaN(count) || start < 0 || count < 0)
      message = "Невірний формат. Введіть два додатних числа через кому.";
    else {
      const deletionSccess = await deleteEntriesFromHistoryStorage(Number(start), Number(count));
      message = deletionSccess
        ? `Було видалено записів з історії: ${count}. Перейдіть на головну сторінку щоб перевірити результат.`
        : "Щось пішло не так. Записи не було видалено. Перевірте введені значення та спробуйте ще раз.";
    }
  }

  const servicePageHtmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="text-align: center; background-color: #0b1120; color: #dce0ea; font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;">
    <p style="font-weight: bold; font-size: 1.5rem; margin-top: 20px">${message}</p>
    <p style="font-size: 1.2rem">
      <a style="color: #dce0ea; font-weight: 400;" href="/api/v1/maintenance?token=${secretToken}">${fullStatus.maintenance ? "Деактивувати режим технічних робіт" : "Активувати режим технічних робіт"}</a>
    </p>
    <p style="font-size: 1.2rem">
      <a style="color: #dce0ea; font-weight: 400;" href="/">На головну<a>
    <p>
  <body>
  </html>
  `;
  res.status(200).send(servicePageHtmlTemplate);
});
app.get("/{*any}", (req: Request, res: Response) => {
  res.status(404).sendFile(path.resolve("./client/dist/index.html"));
});

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
        console.log(`Failed to start Telegram bot:`, error);
      });
  }
});
