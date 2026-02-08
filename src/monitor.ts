import suncalc from "suncalc";
import fullStatus, { updateHistory, Status, updateFullStatus } from "./statusStorage.js";

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

export default async function updateStatus() {
  const freshStatus = await checkStatus();

  if (lastSunCheckHourCache !== new Date().getHours()) {
    const times = suncalc.getTimes(new Date(), Number(process.env.LAT), Number(process.env.LONG));
    fullStatus.sun.sunrise = times.sunrise;
    fullStatus.sun.sunset = times.sunset;
    lastSunCheckHourCache = new Date().getHours();
  }

  if (fullStatus.status === freshStatus.status) {
    await updateHistory(freshStatus);
    await updateFullStatus(freshStatus);
    errorCounter = 0;
  } else {
    if (freshStatus.status === false) {
      errorCounter++;
      if (errorCounter === 3) {
        await updateHistory(freshStatus, true);
        await updateFullStatus(freshStatus, true);
        errorCounter = 0;
      }

      updateFullStatus(freshStatus);
    } else {
      await updateHistory(freshStatus, true);
      await updateFullStatus(freshStatus, true);
    }
  }
}
