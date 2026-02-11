import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
    // for app to work, at least empty file should exist, so don't forget to create it before first build
    const historyString: string = await readFile(fileLocation, "utf-8");

    return JSON.parse(historyString || "{}") as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(errorMessage);
    return undefined;
  }
}
export async function writeDataToFile<T>(fileLocation: string, data: T): Promise<boolean> {
  try {
    const historyString = JSON.stringify(data);
    await writeFile(fileLocation, historyString);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(errorMessage);
    return false;
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
    const backupFileName = `${fileToBackupName}-${backupDayOfWeek}.${fileToBackupExtension}`;
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
