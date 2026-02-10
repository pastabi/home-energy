import type {
  CurrentStatus,
  CurrentStatusContent,
  HistoryEntry,
  HistoryEntryContent,
  MillisecondsPassed,
  OldHistoryEntryContent,
} from "./types";
import {
  arrayOfTextForWeekdays,
  generateArrayOfDaysStartTimestamps,
  myIsAfter,
  myIsSameDay,
  myStartOfDay,
  textForTimeAndDate,
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
  sun: { sunrise: "", sunset: "" },
  maintenance: false,
};

export const currentStatusContent: CurrentStatusContent = {
  statusText: "Світло ...",
  formattedDateText: "Остання перевірка була __ cек назад (о __:__)",
  statusPrediction: "",
  history: [],
  messageText: "",
};

export let millisecondsPassed: MillisecondsPassed = 0;
// ----- DATA ZONE END -----

// ----- FUNCTIONS ZONE START -----
// fetch data from the server
async function getStatusData(): Promise<CurrentStatus | undefined> {
  const apiUrl: string = "/api/v1/status";

  try {
    const response = await fetch(apiUrl);

    if (response.status === 429)
      throw new Error(`Забагато запитів. Охолодіть свій пил та спробуйте через 10 хвилин.`);
    if (!response.ok) {
      throw new Error(`Щось пішло не так з запитом до серверу. Статус: ${response.status}`);
    }
    const { fullStatus: data }: { fullStatus: CurrentStatus } = await response.json();

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Невідома помилка. Спробуйте пізніше.";
    currentStatusContent.messageText = errorMessage;
    console.log(errorMessage);
  }
}

function constructHistoryContentArray(): void {
  const daysStartTimestamps = generateArrayOfDaysStartTimestamps();
  const daysStartTexts = arrayOfTextForWeekdays(daysStartTimestamps);

  const coef = 4; // x minutes = 1px of height
  const maxHistoryReturnOldness = 1000 * 60 * 60 * 24 * 7; // 7 days
  const theLastAcceptableHistoryEntryTimestamp: number = Date.now() - maxHistoryReturnOldness;
  const startOfLastAcceptableDay: number = myStartOfDay(
    new Date(theLastAcceptableHistoryEntryTimestamp),
  ).getTime();

  let historyContent: HistoryEntryContent[] | OldHistoryEntryContent = [];

  if (
    currentStatus.history.length === 1 &&
    new Date(currentStatus.history.at(0)!.dateOfChange).getTime() < startOfLastAcceptableDay
  ) {
    historyContent = {
      lastStatus: currentStatus.history.at(0)!.changedToStatus,
      lastStatusChangeDateText: textForTimeAndDate(
        new Date(currentStatus.history.at(0)!.dateOfChange).getTime(),
      ),
    };
  } else {
    let previousEntry: HistoryEntryContent | undefined;
    let allowAllLastDay: boolean = false;

    historyContent = currentStatus.history.map(
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
          if (new Date(dateOfChange).getTime() < startOfLastAcceptableDay) {
            content.statusDuration.statusHeight = -1;
            break;
          } else if (
            (!previousEntryDate &&
              myIsAfter(new Date(daysStartTimestamps[i]), new Date(dateOfChange))) ||
            (myIsAfter(new Date(daysStartTimestamps[i]), new Date(dateOfChange)) &&
              myIsAfter(new Date(previousEntryDate), new Date(daysStartTimestamps[i])))
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
            myIsAfter(new Date(previousEntryDate), new Date(daysStartTimestamps[i])) &&
            myIsAfter(new Date(dateOfChange), new Date(daysStartTimestamps[i]))
          ) {
            if (Array.isArray(content.dayChange) && content.dayChange.length === 0)
              content.dayChange = false;
            break;
          } else if (
            // condition for these entries, who may got in the last available day
            myIsAfter(new Date(daysStartTimestamps[i]), new Date(dateOfChange)) &&
            !daysStartTimestamps.at(i + 2)
          ) {
            const lastDayStartTimestamp = daysStartTimestamps.at(i + 1);

            if (allowAllLastDay) {
              content.dayChange = false;
            } else if (
              // check if the entry really after the start of the last day and before start of the one before last
              myIsAfter(new Date(dateOfChange), new Date(lastDayStartTimestamp || Date.now()))
            ) {
              content.dayChange = false;
            } else if (
              // to handle situatioins when some near last entry has many day changes in it
              // so we "allow" all entries from that day that were send to show off, to not cut them
              previousEntry &&
              Array.isArray(previousEntry.dayChange) &&
              previousEntry.dayChange.length > 1 &&
              myIsSameDay(new Date(previousEntry.thisStatus.statusISOTime), new Date(dateOfChange))
            ) {
              content.dayChange = false;
              allowAllLastDay = true;
            } else {
              // just giving this value for future filtering based on it
              content.statusDuration.statusHeight = -1;
            }
            break;
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
        const startOfDateTimeStamp = myStartOfDay(new Date(dateOfChangeTimestamp)).getTime();
        const lastEntryTimeDiff = dateOfChangeTimestamp - startOfDateTimeStamp;
        const lastEntryHeight = lastEntryTimeDiff / 1000 / 60 / coef;
        const lastEntryText = textForWeekday(startOfDateTimeStamp);

        content.ifLastEntry = { lastEntryHeight, lastEntryText };

        previousEntry = content;
        return content;
      },
    );

    previousEntry = undefined;
    allowAllLastDay = false;
    // filtering entries older than week ago (if such were present)
    historyContent = historyContent.filter(
      (contentEntry) => contentEntry.statusDuration.statusHeight !== -1,
    );
  }

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
  let timePassed;
  const secondsPassed = Math.floor(millisecondsPassed / 1000);

  if (secondsPassed <= 120) timePassed = `${secondsPassed} сек`;
  else timePassed = `${Math.floor(secondsPassed / 60)} хв`;

  const lastCheckString = `Остання перевірка була ${timePassed} назад (о ${formattedDate})`;
  currentStatusContent.formattedDateText = lastCheckString;
}

// called every minute, in syncronization with server check interval
// initialize the data fetch and immidiately update all state based on the new data
export async function updateStatusData(): Promise<void> {
  const data = await getStatusData();
  console.log(data);
  if (!data) return;
  // update current state object
  currentStatus.status = data.status;
  currentStatus.lastCheckDate = data.lastCheckDate;
  currentStatus.lastCheckStatus = data.lastCheckStatus;
  // currentStatus.lastCheckStatus = false;
  currentStatus.history = data.history;
  currentStatus.sun = data.sun;
  currentStatus.maintenance = data.maintenance;

  // update text object based on the current state and milliseconds passed, which will be used by update screen functions
  currentStatusContent.statusText = currentStatus.status ? "Світло є" : "Світла нема";
  updateLastCheckDate();
  currentStatusContent.statusPrediction =
    currentStatus.status && !currentStatus.lastCheckStatus ? "і, мoжливо, світла немає..." : "";
  currentStatusContent.messageText = !currentStatus.maintenance
    ? ""
    : "На сервері тривають технічні роботи. Статус світла дома наразі не перевіряється.";

  // history data will go through a lot of transformation before displaying on screen
  // we handle all this transformation in separate function
  constructHistoryContentArray();
}

// ----- FUNCTIONS ZONE END -----
