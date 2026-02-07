import { isAfter, startOfDay } from "date-fns";
import type {
  CurrentStatus,
  CurrentStatusContent,
  HistoryEntry,
  HistoryEntryContent,
  MillisecondsPassed,
} from "./types";
import {
  arrayOfTextForWeekdays,
  generateArrayOfDaysStartTimestamps,
  textForWeekday,
  toHoursAndMinutes,
  toTimeOfDay,
} from "./utils";

// ----- DATA ZONE START -----
export const currentStatus: CurrentStatus = {
  status: false,
  lastCheckDate: "",
  lastCheckStatus: false,
  history: [],
};

export const currentStatusContent: CurrentStatusContent = {
  statusText: "Світло ...",
  formattedDateText: "Остання перевірка була __ cек назад (о __:__)",
  statusPrediction: "",
  history: [],
};

export let millisecondsPassed: MillisecondsPassed = 0;
// ----- DATA ZONE END -----

// ----- FUNCTIONS ZONE START -----
// fetch data from the server
async function getStatusData(): Promise<CurrentStatus | undefined> {
  const apiUrl: string = "/api/v1/status";

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Energy status request failed. Status: ${response.status}`);
    }
    const { fullStatus: data }: { fullStatus: CurrentStatus } = await response.json();

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? console.log(error.message) : "Unknown error";
    console.log(errorMessage);
  }
}

function constructHistoryContentArray(): void {
  const daysStartTimestamps = generateArrayOfDaysStartTimestamps();
  const daysStartTexts = arrayOfTextForWeekdays(daysStartTimestamps);

  const coef = 4; // x minutes = 1px of height

  let historyContent: HistoryEntryContent[] = currentStatus.history.map(
    (entry: HistoryEntry, entryIndex: number, rawHistory): HistoryEntryContent => {
      const { changedToStatus, dateOfChange } = entry;
      let previousEntryDate =
        entryIndex > 0 ? rawHistory.at(entryIndex - 1)?.dateOfChange || "" : "";

      const content: HistoryEntryContent = {
        statusDuration: { durationText: "", statusHeight: 0 },
        dayChange: [],
        thisStatus: { toStatus: changedToStatus, timeText: "", statusISOTime: "" },
        ifLastEntry: { lastEntryHeight: 0, lastEntryText: "" },
      };

      // filling dayChange
      for (let i = 0; i < daysStartTimestamps.length; i++) {
        if (
          (!previousEntryDate &&
            isAfter(new Date(daysStartTimestamps[i]), new Date(dateOfChange))) ||
          (isAfter(new Date(daysStartTimestamps[i]), new Date(dateOfChange)) &&
            isAfter(new Date(previousEntryDate), new Date(daysStartTimestamps[i])))
        ) {
          const timestampsDifference = daysStartTimestamps[i] - new Date(dateOfChange).getTime();
          const height = timestampsDifference / 1000 / 60 / coef;
          const text = daysStartTexts[i];
          if (Array.isArray(content.dayChange)) {
            content.dayChange.push({
              dayStartHeight: height,
              weekdayText: text,
              weekdayISOTime: new Date(daysStartTimestamps[i]).toISOString(),
            });
          }
          continue;
        } else if (
          isAfter(new Date(previousEntryDate), new Date(daysStartTimestamps[i])) &&
          isAfter(new Date(dateOfChange), new Date(daysStartTimestamps[i]))
        ) {
          if (Array.isArray(content.dayChange) && content.dayChange.length === 0)
            content.dayChange = false;
          break;
        } else if (
          isAfter(new Date(daysStartTimestamps[i]), new Date(dateOfChange)) &&
          !daysStartTimestamps.at(i + 1)
        ) {
          // just giving this value for future filtering based on it
          content.statusDuration.statusHeight = -1;
        }
      }

      // filling statusDuration
      if (content.statusDuration.statusHeight !== -1) {
        previousEntryDate = !previousEntryDate ? new Date().toISOString() : previousEntryDate;
        const timestampsDifference =
          new Date(previousEntryDate).getTime() - new Date(dateOfChange).getTime();
        const height = timestampsDifference / 1000 / 60 / coef;
        const text = toHoursAndMinutes(timestampsDifference);
        content.statusDuration = { statusHeight: height, durationText: text };
      }

      // filling statusChangeText
      content.thisStatus.timeText = toTimeOfDay(dateOfChange);
      content.thisStatus.statusISOTime = dateOfChange;

      // filling ifLastEntry
      const dateOfChangeTimestamp: number = new Date(dateOfChange).getTime();
      const startOfDateTimeStamp = startOfDay(new Date(dateOfChangeTimestamp)).getTime();
      const lastEntryTimeDiff = dateOfChangeTimestamp - startOfDateTimeStamp;
      const lastEntryHeight = lastEntryTimeDiff / 1000 / 60 / coef;
      const lastEntryText = textForWeekday(startOfDateTimeStamp);

      content.ifLastEntry = { lastEntryHeight, lastEntryText };

      return content;
    },
  );

  // filtering entries older than week ago (if such were present)
  historyContent = historyContent.filter(
    (contentEntry) => contentEntry.statusDuration.statusHeight !== -1,
  );

  currentStatusContent.history = historyContent;
}

function updateMillisecondsPassed(): void {
  // add 5 seconds to the actual last check time, to get a buffer
  // so when we fetch the data next time, we know for sure that server already got the fresh one
  const lastCheckDate: number = new Date(currentStatus.lastCheckDate).getTime() + 5000;
  const now: number = Date.now();
  if (lastCheckDate > now) millisecondsPassed = 60000 - (lastCheckDate - now);
  else millisecondsPassed = now - lastCheckDate;
}

// called every second to display seconds since from last check
// updating milliseconds veriable and instantly updating text content based on it
export function updateLastCheckDate(): void {
  updateMillisecondsPassed();
  currentStatus.lastCheckDate;
  const formattedDate: string = new Date(currentStatus.lastCheckDate).toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
  });

  const secondsPassed = Math.floor(millisecondsPassed / 1000);
  const lastCheckString = `Остання перевірка була ${secondsPassed} cек назад (о ${formattedDate})`;
  currentStatusContent.formattedDateText = lastCheckString;
}

// called every minute, in syncronization with server check interval
// initialize the data fetch and immidiately update all state based on the new data
export async function updateStatusData(): Promise<void> {
  const data = await getStatusData();
  if (!data) return;
  // update current state object
  currentStatus.status = data.status;
  currentStatus.lastCheckDate = data.lastCheckDate;
  currentStatus.lastCheckStatus = data.lastCheckStatus;
  // currentStatus.lastCheckStatus = false;
  currentStatus.history = data.history;

  // update text object based on the current state and milliseconds passed, which will be used by update screen functions
  currentStatusContent.statusText = currentStatus.status ? "Світло є" : "Світла нема";
  updateLastCheckDate();
  currentStatusContent.statusPrediction =
    currentStatus.status && !currentStatus.lastCheckStatus ? "і, мoжливо, світла немає..." : "";

  // keep history data as is, because it will go through a lot of transformation before displaying on screen
  // so we handle all this transformation in separate function
  constructHistoryContentArray();

  // currentStatusContent.history = currentStatus.history;
}

// ----- FUNCTIONS ZONE END -----
