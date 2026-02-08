import path from "path";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageFileName = "status-history.json";
// const storageFileName = "status-history-test.json";

export type Status = {
  status: boolean;
  checkDate: Date;
};

type HistoryEntry = {
  changedToStatus: boolean;
  dateOfChange: Date;
};

type HistoryStorage = {
  lastStatus: Status;
  history: HistoryEntry[];
};

type FullStatus = {
  status: boolean;
  lastCheckDate: Date;
  lastCheckStatus: boolean;
  history: HistoryEntry[];
  sun: { sunrise: Date; sunset: Date };
};

// default value on server start before the last value retrieved from storage
let fullStatus: FullStatus = {
  status: false,
  lastCheckDate: new Date(),
  lastCheckStatus: false,
  history: [],
  sun: { sunrise: new Date(), sunset: new Date() },
};

async function getHistory(): Promise<HistoryStorage | undefined> {
  const filePath = path.resolve(__dirname, "..", storageFileName);
  try {
    // for app to work, at least empty file should exist, so don't forget to create it before first build
    const historyString: string = await readFile(filePath, "utf-8");

    const historyObject: HistoryStorage = JSON.parse(historyString || "{}");

    if (!historyObject.lastStatus)
      historyObject.lastStatus = { status: false, checkDate: new Date() };
    if (!historyObject.history) historyObject.history = [];

    return historyObject;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(errorMessage);
  }
}

async function setHistory(history: HistoryStorage): Promise<void> {
  const filePath = path.resolve(__dirname, "..", storageFileName);
  try {
    const historyString = JSON.stringify(history);
    await writeFile(filePath, historyString);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(errorMessage);
  }
}

async function createNewHistoryStorage(
  status: Status,
  newStatus: boolean = false,
  retryMinsToFalse: number = 3,
): Promise<HistoryStorage | undefined> {
  const historyStorage = await getHistory();
  if (!historyStorage) return;

  if (!newStatus) historyStorage.lastStatus = status;
  else {
    const newEnergyStatus = status.status;

    if (newEnergyStatus === true) {
      // if energy appeared, we don't do retries, so we set date as is
      historyStorage.history.unshift({
        changedToStatus: newEnergyStatus,
        dateOfChange: status.checkDate,
      });
    } else {
      // the _checkDate_ property of last retry that will return false will be _retryMinsToFalse_ minutes after the electricity actually disapeared, so we need to substract the time spent on retires to calculate actual timestamp when energy dissapeared
      function substractMinutes(date: Date, minutes: number): Date {
        const dateMilisecondsNumber = date.getTime();
        const minutesMillisecondsNumber = minutes * 60 * 1000;
        return new Date(dateMilisecondsNumber - minutesMillisecondsNumber);
      }

      historyStorage.history.unshift({
        changedToStatus: newEnergyStatus,
        dateOfChange: substractMinutes(status.checkDate, retryMinsToFalse),
      });
    }

    // _lastStatus_ we keep the last version either way, because it's last available information about the connection status, not the info about last status change, which we were modifying to keep in history
    historyStorage.lastStatus = status;
  }

  // await setHistory(historyStorage);
  return historyStorage;
}

async function updateHistory(newHistoryStorage: HistoryStorage): Promise<void> {
  await setHistory(newHistoryStorage);
}

function filterOldHistoryEntries(historyArray: HistoryEntry[]): HistoryEntry[] {
  // storing maximum of 7 days of history in the data we will return
  const maxHistoryReturnLength = 1000 * 60 * 60 * 24 * 7; // 7 days
  const theLastAcceptableHistoryEntryTimestamp = Date.now() - maxHistoryReturnLength;

  let filteredHistoryArray = historyArray.filter(
    (entry) => new Date(entry.dateOfChange).getTime() >= theLastAcceptableHistoryEntryTimestamp,
  );

  if (filteredHistoryArray.length === 0) {
    const lastEntry = historyArray.shift();
    if (lastEntry) filteredHistoryArray.push(lastEntry);
  }

  return filteredHistoryArray;
}

function updateFullStatus(
  freshStatus: Status,
  newHistoryStorage: boolean | HistoryStorage = false,
): void {
  fullStatus.lastCheckStatus = freshStatus.status;
  fullStatus.lastCheckDate = freshStatus.checkDate;
  if (typeof newHistoryStorage !== "boolean") {
    fullStatus.status = freshStatus.status;
    fullStatus.history = filterOldHistoryEntries(newHistoryStorage.history);
  }
}

async function setFullStatusFromHistory(): Promise<void> {
  const historyStorage = await getHistory();
  if (!historyStorage) return;

  fullStatus.status = historyStorage.lastStatus.status;
  fullStatus.lastCheckDate = historyStorage.lastStatus.checkDate;
  fullStatus.lastCheckStatus = historyStorage.lastStatus.status;
  fullStatus.history = filterOldHistoryEntries(historyStorage.history);
}

export default fullStatus;

export { createNewHistoryStorage, updateFullStatus, updateHistory, setFullStatusFromHistory };
