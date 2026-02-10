import { readFile, writeFile } from "node:fs/promises";

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
