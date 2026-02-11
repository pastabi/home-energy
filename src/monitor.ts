import { notifyAllUsers } from "./services/telegram.js";
import { telegramStorageLocation } from "./services/userStorageOperations.js";
import fullStatus, {
  updateHistory,
  Status,
  updateFullStatus,
  createNewHistoryStorage,
  updateSunData,
  historyStorageLocation,
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
let lastSunCheckHourCache: number = NaN;
let lastSunCheckDayCache: number = NaN;

function everyHourActions() {
  const thisHour = new Date().getHours();
  if (lastSunCheckHourCache !== thisHour) {
    // update sun data
    updateSunData();
    // split history file storage
    lastSunCheckHourCache = thisHour;
  }
}
async function everyDayActions() {
  const thisDay = new Date().getDate();
  if (lastSunCheckDayCache !== thisDay) {
    // backup file storages
    await backupFileStorages(historyStorageLocation, telegramStorageLocation);
    lastSunCheckDayCache = thisDay;
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
