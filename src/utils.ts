import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function myStartOfDay(date: Date): Date {
  const theDateCopy = new Date(date);
  theDateCopy.setHours(0, 0, 0, 0);
  return theDateCopy;
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
export async function writeDataToFile<T>(fileLocation: string, data: T): Promise<void> {
  try {
    const historyString = JSON.stringify(data);
    await writeFile(fileLocation, historyString);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(errorMessage);
  }
}

export async function backupFileStorages(...fileLocations: string[]) {
  const backupsDirname = path.join(import.meta.dirname, "..", "backups");
  await mkdir(backupsDirname, { recursive: true });
  for (const fileLocation of fileLocations) {
    const fileToBackupName = path.basename(fileLocation).split(".").at(0);
    const fileToBackupExtension = path.extname(fileLocation);
    const backupDayOfWeek = new Date().getDay();
    // we will keep only 7 days of backups, so when week passes, we just overwrite the same day from the last week
    const backupFileName = `${fileToBackupName}-${backupDayOfWeek}.${fileToBackupExtension}`;
    const backupFileLocation = path.resolve(backupsDirname, backupFileName);
    try {
      await copyFile(fileLocation, backupFileLocation);
      console.log(`Backup for file ${fileToBackupName}`);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.warn("Source file not found, skipping backup until data is created.");
      } else {
        console.error("Unexpected backup error:", error);
      }
    }
  }
}
