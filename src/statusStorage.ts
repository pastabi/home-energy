import path from "path";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const storageFileName = "status-history.json";
const storageFileName = "status-history-test.json";

export type Status = {
  status: boolean;
  checkDate: Date;
};

type HistoryEntry = {
  changedToStatus: boolean;
  dateOfChange: Date;
};

type History = {
  lastStatus: Status;
  history: HistoryEntry[];
};

type FullStatus = {
  status: boolean;
  lastCheckDate: Date;
  lastCheckStatus: boolean;
  history: HistoryEntry[];
};

// default value on server start before the last value retrieved from storage
let fullStatus: FullStatus = {
  status: false,
  lastCheckDate: new Date(),
  lastCheckStatus: false,
  history: [],
};

async function getHistory(): Promise<History | undefined> {
  const filePath = path.resolve(__dirname, storageFileName);

  try {
    const historyString: string = await readFile(filePath, "utf-8");

    // will crash the app if not valid json, learn how to handle
    const historyObject: History = JSON.parse(historyString || "{}");

    if (!historyObject.lastStatus)
      historyObject.lastStatus = { status: false, checkDate: new Date() };
    if (!historyObject.history) historyObject.history = [];

    return historyObject;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(errorMessage);
  }
}

async function setHistory(history: History): Promise<void> {
  try {
    const historyString = JSON.stringify(history);
    await writeFile(path.resolve(__dirname, storageFileName), historyString);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(errorMessage);
  }
}

async function updateHistory(
  status: Status,
  newStatus: boolean = false,
  retryMinsToFalse: number = 3,
): Promise<History | undefined> {
  const history = await getHistory();
  if (!history) return;

  if (!newStatus) history.lastStatus = status;
  else {
    const newEnergyStatus = status.status;

    if (newEnergyStatus === true) {
      // if evergy appeared, we don't do retries, so we set date as is
      history.history.unshift({
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

      history.history.unshift({
        changedToStatus: newEnergyStatus,
        dateOfChange: substractMinutes(status.checkDate, retryMinsToFalse),
      });
    }

    // _lastStatus_ we keep as is either way, because it's last available information about the connection status, not the info about last status change, which we want to keep in history
    history.lastStatus = status;
  }

  await setHistory(history);
}

// to be able to get the new history, we need to run this only after awaiting _updateHistory()_
async function updateFullStatus(freshStatus: Status, newStatus: Boolean = false): Promise<void> {
  fullStatus.lastCheckStatus = freshStatus.status;
  fullStatus.lastCheckDate = freshStatus.checkDate;
  if (newStatus) {
    fullStatus.status = freshStatus.status;
    const newHistory = await getHistory();
    if (!newHistory) return;

    fullStatus.history = newHistory.history;
  }
}

async function setFullStatusFromHistory(): Promise<void> {
  const history = await getHistory();
  if (!history) return;

  fullStatus.status = history.lastStatus.status;
  fullStatus.lastCheckDate = history.lastStatus.checkDate;
  fullStatus.lastCheckStatus = history.lastStatus.status;
  fullStatus.history = history.history;
}

export default fullStatus;

export { updateHistory, updateFullStatus, setFullStatusFromHistory };
