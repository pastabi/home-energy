import { startOfDay } from "date-fns";

const options = { timeZone: "Europe/Kyiv" };

export function generateArrayOfDaysStartTimestamps(numberOfDays: number = 7): number[] {
  const startOfToday = startOfDay(new Date()).getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  let daysStarts = [];
  // generate array of timestamps of days' starts for last week
  for (let i = 0; i < numberOfDays; i++) {
    daysStarts.push(startOfToday - oneDay * i);
  }

  return daysStarts;
}

export function textForWeekday(timestamp: number): string {
  return new Date(timestamp)
    .toLocaleTimeString("uk-UA", {
      ...options,
      day: "2-digit",
      month: "2-digit",
      weekday: "long",
    })
    .split(",")
    .slice(0, -1)
    .join(",");
}

export function arrayOfTextForWeekdays(timestamps: number[]): string[] {
  return timestamps.map(textForWeekday);
}

export function toHoursAndMinutes(milliseconds: number): string {
  let minutes = Math.floor((milliseconds / 1000 / 60) % 60);
  let hours = Math.floor(milliseconds / 1000 / 60 / 60);

  const dispayedTime = hours === 0 ? `${minutes} хв` : `${hours} год ${minutes} хв`;

  // let finalString = hours ? [hours, String(minutes).padStart(2, "0")].join(":") : minutes;
  return dispayedTime;
}

export function toTimeOfDay(date: string): string {
  return new Date(date).toLocaleTimeString("uk-UA", {
    ...options,
    hour: "2-digit",
    minute: "2-digit",
  });
}
