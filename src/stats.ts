import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import express, { Request } from "express";
import { htmlTemplate } from "./utils.js";

type DailyStats = {
  dateOfStats: string;
  totalVisits: number;
  botHits: number;
  userVisits: number;
  totalUniqueVisitors: number;
  botUniqueVisitors: number;
  userUniqueVisitors: number;
  lastVisits: string[];
};

const router = express.Router();

const logDirectory = path.join(import.meta.dirname, "..", "logs");
await mkdir(logDirectory, { recursive: true });

function getLogFileLocation(): string {
  const dateString = new Date().toISOString().split("T").at(0)!;
  return path.resolve(logDirectory, `visits-${dateString}.csv`);
}

export async function logVisits(req: Request) {
  const reqInfo = {
    timestamp: new Date().toISOString(),
    ip: req.ip || "ip-unknown",
    url: req.originalUrl,
    userAgent: (req.get("User-Agent") || "user-agent-unknown").replace(/"/g, '""'),
  };

  if (reqInfo.ip === process.env.MY_IP) return;

  const logString = `${reqInfo.timestamp},"${reqInfo.url}",${reqInfo.ip},"${reqInfo.userAgent}"\n`;

  try {
    await appendFile(getLogFileLocation(), logString);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Logging error: ${errorMessage}`);
  }
}

export async function getDailyStats(): Promise<DailyStats> {
  const dateOfStats = new Date().toISOString().split("T").at(0)!;
  let lines: string[] = [];
  try {
    const todayLogs = await readFile(getLogFileLocation(), "utf-8");
    lines = todayLogs
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Reading log file error: ${errorMessage}`);
    return {
      dateOfStats,
      totalVisits: 0,
      botHits: 0,
      userVisits: 0,
      totalUniqueVisitors: 0,
      botUniqueVisitors: 0,
      userUniqueVisitors: 0,
      lastVisits: [],
    };
  }

  const totalVisits = lines.length;
  const uniqueVisitorsSet = new Set<string>();
  const uniqueBotsSet = new Set<string>();
  let botHits = 0;

  const lastVisits = lines
    .map((line) => {
      const match = line.match(/^([^,]+),"(.*)",([^,]+),"(.*)"$/);

      if (!match) return null;
      const [, time, url, ip, agent] = match;
      uniqueVisitorsSet.add(ip);
      const ua = agent.toLowerCase();

      if (
        ua.includes("bot") ||
        ua.includes("crawl") ||
        ua.includes("spider") ||
        ua.includes("headless") ||
        ua.includes("curl")
      ) {
        uniqueBotsSet.add(ip);
        botHits++;
      }

      const agentDetails = agent.match(/\((.*?)\)/)?.[1] || agent.substring(0, 30);

      return `${time.split("T").at(1)!.split(".").at(0)!} - ${ip} - ${agentDetails}\n`;
    })
    .filter((line): line is string => line !== null)
    .slice(-10)
    .reverse();

  return {
    dateOfStats,
    totalVisits,
    botHits,
    userVisits: totalVisits - botHits,
    totalUniqueVisitors: uniqueVisitorsSet.size,
    botUniqueVisitors: uniqueBotsSet.size,
    userUniqueVisitors: uniqueVisitorsSet.size - uniqueBotsSet.size,
    lastVisits,
  };
}

router.get("/", async (req, res) => {
  const userToken = req.query.token as string;
  const secretToken = process.env.MAINTENANCE_TOKEN;

  if (!secretToken)
    return res
      .status(500)
      .send(htmlTemplate("<p>Для початку треба налаштувати токен на сервері.</p>"));
  if (!userToken || userToken !== secretToken)
    return res
      .status(403)
      .send(htmlTemplate("<p>Неправильний токен. Перевірте токен та спробуйте ще раз.</p>"));

  try {
    const {
      dateOfStats,
      totalVisits,
      userVisits,
      totalUniqueVisitors,
      userUniqueVisitors,
      lastVisits,
    } = await getDailyStats();
    const htmlContent = `
    <div style="text-align: left;">
      <p>Статистика за <time style="font-weight: bold">${dateOfStats}</time></p>
      <p>Всього відвідувань: ${totalVisits}</p>
      <p>Відвідувань реальних користувачів: ${userVisits}</p>
      <p>Унікальних відвідувачів: ${totalUniqueVisitors}</p>
      <p>Реальних користувачів: ${userUniqueVisitors}</p>
      <p>Отанні відвідування:</p>
      <ul>
      ${lastVisits
        .map(
          (line) =>
            ` <li style="margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px dashed #dbdbdb;">${line}</li>`,
        )
        .join("")}
      </ul>
    </div>
  `;
    res.status(200).send(htmlTemplate(htmlContent));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Displaying log file error: ${errorMessage}`);
    res.status(500).send(htmlTemplate("<p>Помилка при генерації сторінки статистики.</p>"));
  }
});

export default router;
