import fullStatus, {
  updateHistory,
  Status,
  updateFullStatus,
  createNewHistoryStorage,
  updateSunData,
} from "./statusStorage.js";

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

export default async function updateStatus(): Promise<void> {
  const freshStatus = await checkStatus();

  if (lastSunCheckHourCache !== new Date().getHours()) {
    updateSunData();
    lastSunCheckHourCache = new Date().getHours();
  }

  if (fullStatus.status === freshStatus.status) {
    const newHistoryStorage = await createNewHistoryStorage(freshStatus);
    if (!newHistoryStorage) return;
    await updateHistory(newHistoryStorage);
    updateFullStatus(freshStatus);
    errorCounter = 0;
  } else {
    if (freshStatus.status === false) {
      errorCounter++;
      if (errorCounter === 3) {
        const newHistoryStorage = await createNewHistoryStorage(freshStatus, true);
        if (!newHistoryStorage) return;
        await updateHistory(newHistoryStorage);
        updateFullStatus(freshStatus, newHistoryStorage);
        errorCounter = 0;
      } else updateFullStatus(freshStatus);
    } else {
      const newHistoryStorage = await createNewHistoryStorage(freshStatus, true);
      if (!newHistoryStorage) return;
      await updateHistory(newHistoryStorage);
      updateFullStatus(freshStatus, newHistoryStorage);
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
