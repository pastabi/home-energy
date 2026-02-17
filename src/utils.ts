import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import net from "node:net";

export function myStartOfDay(date: Date): Date {
  const theDateCopy = new Date(date);
  theDateCopy.setUTCHours(0, 0, 0, 0);
  return theDateCopy;
}
export function myStartOfMonth(date: Date): Date {
  const theDateCopy = new Date(date);
  theDateCopy.setUTCHours(0, 0, 0, 0);
  theDateCopy.setUTCDate(1);
  return theDateCopy;
}
export function myIsSameMonth(firstDate: Date, secondDate: Date): boolean {
  return (
    firstDate.getUTCMonth() === secondDate.getUTCMonth() &&
    firstDate.getUTCFullYear() === secondDate.getUTCFullYear()
  );
}
export function getYearAndMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}
export function substractMinutes(date: Date, minutes: number): Date {
  const dateMilisecondsNumber = date.getTime();
  const minutesMillisecondsNumber = minutes * 60 * 1000;
  return new Date(dateMilisecondsNumber - minutesMillisecondsNumber);
}

export async function readDataFromFile<T>(fileLocation: string): Promise<T | undefined> {
  try {
    const fileDataString: string = await readFile(fileLocation, "utf-8");

    return JSON.parse(fileDataString || "{}") as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(errorMessage);
    return undefined;
  }
}
export async function writeDataToFile<T>(
  fileLocation: string,
  data: T,
  writeOnly: boolean = false,
): Promise<{ result: boolean; code: string }> {
  const options = { flag: `${writeOnly ? "wx" : ""}` };
  try {
    const historyString = JSON.stringify(data);
    await writeFile(fileLocation, historyString, options);
    return { result: true, code: "" };
  } catch (error: any) {
    if (error.code === "EEXIST") return { result: true, code: "EEXIST" };

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(errorMessage);
    return { result: false, code: error.code || "UNKNOWN" };
  }
}

export async function backupFileStorages(...fileLocations: string[]): Promise<boolean> {
  const backupsDirname = path.join(import.meta.dirname, "..", "backups");
  await mkdir(backupsDirname, { recursive: true });
  for (const fileLocation of fileLocations) {
    const fileToBackupName = path.basename(fileLocation).split(".").at(0);
    const fileToBackupExtension = path.extname(fileLocation);
    const utcDay = new Date().getUTCDay();
    const backupDayOfWeek = utcDay === 0 ? 7 : utcDay;
    // we will keep only 7 days of backups, so when week passes, we just overwrite the same day from the last week
    const backupFileName = `${fileToBackupName}-${backupDayOfWeek}${fileToBackupExtension}`;
    const backupFileLocation = path.resolve(backupsDirname, backupFileName);
    try {
      await copyFile(fileLocation, backupFileLocation);
      console.log(`Backup for ${fileToBackupName} was created.`);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.warn("Source file not found, skipping backup until data is created.");
      } else {
        console.error("Unexpected backup error:", error);
      }
      return false;
    }
  }
  return true;
}

export function htmlTemplate(content: string): string {
  const pageHtml = `
  <!DOCTYPE html>
  <html lang="uk">
  <head>
  <meta charset="UTF-8" />
  <link
    rel="icon"
    type="image/svg+xml"
    href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ffe62b'/></svg>"
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
  * {
    margin: 0;
    padding: 0;
  }
  body {
    text-align: center;
    background-color: #0b1120;
    color: #dce0ea;
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 12px;
  }
  ul {
    list-style: none;
  }
  p {
    margin-bottom: 8px;
  }
  </style>
  </head>
  <body>
    ${content}
  <body>
  </html>
  `;
  return pageHtml;
}

export async function checkPort(host: string, port: number, timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeout);

    socket.once("connect", () => {
      status = true;
      socket.destroy();
    });
    socket.once("timeout", () => {
      socket.destroy();
    });
    socket.once("error", () => {
      socket.destroy();
    });

    socket.once("close", () => {
      resolve(status);
    });

    socket.connect(port, host);
  });
}
