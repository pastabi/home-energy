import { notifyAllUsers } from "./services/telegram.js";
import { telegramStorageLocation } from "./services/userStorageOperations.js";
import fullStatus, {
  updateHistory,
  Status,
  updateFullStatus,
  createNewHistoryStorage,
  updateSunData,
  historyStorageLocation,
  monthlyHistoryStorageSplit,
} from "./statusStorage.js";
import { backupFileStorages } from "./utils.js";

const url = process.env.HOME_URL;

async function checkStatus(): Promise<Status> {
  try {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), 5000);
    if (!url) throw new Error("HOME_URL is not defined in .env file");

    const responce = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let status: boolean = responce.status === 401 || responce.status === 200 ? true : false;

    return { status, checkDate: new Date() };
  } catch (error) {
    return { status: false, checkDate: new Date() };
  }
}

let errorCounter: number = 0;
let lastCheckHourCache: number = NaN;
let lastCheckDayCache: number = NaN;

function everyHourActions() {
  const thisHour = new Date().getUTCHours();
  if (lastCheckHourCache !== thisHour) {
    // running updateSunData every hour ensures compatibility with any place on Earth,
    // so whatever place we choose, it will get the fresh sunrise/sunset data
    updateSunData();
    lastCheckHourCache = thisHour;
  }
}
async function everyDayActions() {
  const thisDay = new Date().getUTCDate();
  if (lastCheckDayCache !== thisDay) {
    // backup file storages
    const backupSuccess = await backupFileStorages(historyStorageLocation, telegramStorageLocation);
    // split history file storage
    const archiveSeccess = await monthlyHistoryStorageSplit();
    if (backupSuccess !== false && archiveSeccess !== false) lastCheckDayCache = thisDay;
  }
}

export default async function updateStatus(): Promise<void> {
  const freshStatus = await checkStatus();

  // the updateStatus run every minute, but for some actions this is too often
  // so there are separate set of actions incapsulated in this function that run every hour
  // --- update sun data | split history file storage ---
  everyHourActions();

  // functions here run every year
  // --- backup file storages ---
  await everyDayActions();

  // update status and history
  if (fullStatus.status === freshStatus.status) {
    const newHistoryStorage = await createNewHistoryStorage(freshStatus);
    await updateHistory(newHistoryStorage);
    updateFullStatus(freshStatus);
    errorCounter = 0;
  } else {
    if (freshStatus.status === false) {
      errorCounter++;
      if (errorCounter === 3) {
        const newHistoryStorage = await createNewHistoryStorage(freshStatus, true);
        await updateHistory(newHistoryStorage);
        updateFullStatus(freshStatus, newHistoryStorage);
        errorCounter = 0;
        await notifyAllUsers("🔦 | Світло зникло.");
      } else updateFullStatus(freshStatus);
    } else {
      const newHistoryStorage = await createNewHistoryStorage(freshStatus, true);
      await updateHistory(newHistoryStorage);
      updateFullStatus(freshStatus, newHistoryStorage);
      await notifyAllUsers("💡 | Світло з'явилось!");
    }
  }
}

let intervalId: NodeJS.Timeout;
export function setupMonitoring() {
  if (!fullStatus.maintenance) {
    clearInterval(intervalId);
    intervalId = setInterval(() => {
      updateStatus();
    }, 60000);
  } else {
    clearInterval(intervalId);
  }
}
