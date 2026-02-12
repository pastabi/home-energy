import suncalc from "suncalc";
import path from "node:path";
import {
  myStartOfDay,
  substractMinutes,
  readDataFromFile,
  writeDataToFile,
  myIsSameMonth,
  getYearAndMonth,
  myStartOfMonth,
} from "./utils.js";
import { copyFile, mkdir } from "node:fs/promises";
const storageFileName = "status-history.json";
export const historyStorageLocation: string = path.resolve(
  import.meta.dirname,
  "..",
  storageFileName,
);

// ----- TYPES START -----
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
  maintenance: boolean;
};
// ----- TYPES END -----

// ----- STORAGE START -----
// default value on server start before the last value retrieved from storage
const fullStatus: FullStatus = {
  status: false,
  lastCheckDate: new Date(),
  lastCheckStatus: false,
  history: [],
  sun: { sunrise: new Date(), sunset: new Date() },
  maintenance: false,
};
export default fullStatus;
// ----- STORAGE END -----

// ----- STORAGE FUNCTIONS START -----
async function getHistory(): Promise<HistoryStorage> {
  let historyObject = await readDataFromFile<HistoryStorage>(historyStorageLocation);
  if (!historyObject)
    historyObject = { lastStatus: { status: false, checkDate: new Date() }, history: [] };
  if (!historyObject.lastStatus)
    historyObject.lastStatus = { status: false, checkDate: new Date() };
  if (!historyObject.history) historyObject.history = [];

  historyObject.history = historyObject.history.map((entry) => {
    return { changedToStatus: entry.changedToStatus, dateOfChange: new Date(entry.dateOfChange) };
  });

  return historyObject;
}

async function setHistory(history: HistoryStorage): Promise<void> {
  await writeDataToFile(historyStorageLocation, history);
}

export async function createNewHistoryStorage(
  status: Status,
  newStatus: boolean = false,
  retryMinsToFalse: number = 3,
): Promise<HistoryStorage> {
  const historyStorage = await getHistory();

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

export async function updateHistory(newHistoryStorage: HistoryStorage): Promise<void> {
  await setHistory(newHistoryStorage);
}

export async function monthlyHistoryStorageSplit(): Promise<boolean | undefined> {
  const currentHistoryStorage = await getHistory();
  const dateOfLastEntry = currentHistoryStorage.history.at(0)?.dateOfChange || new Date();
  const thisMonth = new Date().getUTCMonth();
  const previousMonth = new Date(new Date().setUTCMonth(thisMonth - 1));
  // checking if the new month may have started
  if (myIsSameMonth(dateOfLastEntry, new Date())) return;
  // checking if the last entry was really from the previous month, or it was from the buffer the months before previous
  if (!myIsSameMonth(dateOfLastEntry, previousMonth)) return;
  else {
    // construct archive content
    type ArchiveHistoryStorage = {
      history: HistoryEntry[];
    };
    let archiveHistoryStorage: ArchiveHistoryStorage = { history: [] };
    archiveHistoryStorage.history = currentHistoryStorage.history.filter((entry) =>
      myIsSameMonth(entry.dateOfChange, dateOfLastEntry),
    );

    // construct file path
    const archiveDirname = path.join(import.meta.dirname, "..", "archive");
    await mkdir(archiveDirname, { recursive: true });

    const fileToArchiveName = storageFileName.split(".").at(0);
    const fileToArchiveExtension = storageFileName.split(".").at(1);

    const fileToArchiveYearAndMonth = getYearAndMonth(dateOfLastEntry);

    const historyStorageArchiveName = `${fileToArchiveName}-${fileToArchiveYearAndMonth}.${fileToArchiveExtension}`;
    const historyStorageArchiveLocation = path.resolve(archiveDirname, historyStorageArchiveName);

    const { result, code } = await writeDataToFile(
      historyStorageArchiveLocation,
      archiveHistoryStorage,
      true,
    );
    if (result) {
      if (code === "EEXIST") {
        console.log(
          "Archive file for this month already exists. Skipping this attempt to create archive.",
        );
        return result;
      }
      console.log(`Archive for ${fileToArchiveYearAndMonth} history storage was created.`);
    } else {
      console.warn("Something went wrong, skipping archive operation until the next try.");
      return result;
    }

    const bufferDuration = 1000 * 60 * 60 * 24 * 9; // 9 days
    const startOfNewMonth = myStartOfMonth(new Date()).getTime();

    const newMonthHisotryStorage = { ...currentHistoryStorage };

    // deleting old entries, leaving only last 9 days to be able to serve them in the first days of the month
    newMonthHisotryStorage.history = newMonthHisotryStorage.history.filter(
      (entry) => entry.dateOfChange.getTime() >= startOfNewMonth - bufferDuration,
    );

    await setHistory(newMonthHisotryStorage);
    return result;
  }
}

function filterOldHistoryEntries(historyArray: HistoryEntry[]): HistoryEntry[] {
  // storing maximum of 7 days of history in the data we will return
  const maxHistoryReturnLength: number = 1000 * 60 * 60 * 24 * 8; // 7 days with one day buffer
  const theLastAcceptableHistoryEntryTimestamp: number = Date.now() - maxHistoryReturnLength;
  const startOfLastAcceptableDay: number = myStartOfDay(
    new Date(theLastAcceptableHistoryEntryTimestamp),
  ).getTime();

  let filteredHistoryArray = historyArray.filter(
    (entry) => new Date(entry.dateOfChange).getTime() >= startOfLastAcceptableDay,
  );

  if (filteredHistoryArray.length === 0) {
    const lastEntry = historyArray.shift();
    if (lastEntry) filteredHistoryArray.push(lastEntry);
  }

  return filteredHistoryArray;
}

export async function deleteEntriesFromHistoryStorage(
  start: number,
  number: number,
): Promise<boolean> {
  const historyStorage = await getHistory();
  if (!Number.isInteger(start) || !Number.isInteger(number)) return false;
  if (start < 0 || number < 0) return false;

  // allow to delete only 2 at a time to not accidently delete the whole history
  if (start >= historyStorage.history.length || number > 2) return false;
  if (historyStorage.history.length < start + number) return false;
  historyStorage.history.splice(start, number);
  await setHistory(historyStorage);
  await setFullStatusFromHistory();
  return true;
}

export function updateFullStatus(
  freshStatus: Status,
  newHistoryStorage: boolean | HistoryStorage = false,
): void {
  fullStatus.lastCheckStatus = freshStatus.status;
  fullStatus.lastCheckDate = freshStatus.checkDate;
  // even though no new entry was added, every new state update we should filter the current history array to not dispay some very old data when there were no new statuses for a long time
  fullStatus.history = filterOldHistoryEntries(fullStatus.history);
  if (typeof newHistoryStorage !== "boolean") {
    fullStatus.status = freshStatus.status;
    fullStatus.history = filterOldHistoryEntries(newHistoryStorage.history);
  }
}

export async function setFullStatusFromHistory(): Promise<void> {
  const historyStorage = await getHistory();

  fullStatus.status = historyStorage.lastStatus.status;
  fullStatus.lastCheckDate = new Date(historyStorage.lastStatus.checkDate);
  fullStatus.lastCheckStatus = historyStorage.lastStatus.status;
  fullStatus.history = filterOldHistoryEntries(historyStorage.history);
  updateSunData();
}

export function updateSunData() {
  const times = suncalc.getTimes(new Date(), Number(process.env.LAT), Number(process.env.LONG));
  fullStatus.sun.sunrise = times.sunrise;
  fullStatus.sun.sunset = times.sunset;
}

// ----- STORAGE FUNCTIONS END -----
