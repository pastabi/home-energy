export type HistoryEntry = {
  changedToStatus: boolean;
  dateOfChange: string;
};

export type CurrentStatus = {
  status: boolean;
  lastCheckDate: string;
  lastCheckStatus: boolean;
  history: HistoryEntry[];
  sun: { sunrise: string; sunset: string };
};

export type WeekdayContent = {
  dayStartHeight: number;
  weekdayText: string;
  weekdayISOTime: string;
};
export type HistoryEntryContent = {
  // height: next status timestamp - this status timestamp / coef
  // text: mm or hh:mm on this status
  statusDuration: { statusHeight: number; durationText: string };
  // height: day change timestamp - this state timestamp / coef
  // text: date and day of the week starting
  dayChange: WeekdayContent[] | false;
  // just time string in hh:mm format and to which status changed
  thisStatus: { toStatus: boolean; timeText: string; statusISOTime: string };
  // infro for the last entry (from the start of the day) by chance if this entry will be last
  ifLastEntry: { lastEntryHeight: number; lastEntryText: string };
};
export type OldHistoryEntryText = {
  howManyDaysAgo: string;
  timeAndDate: string;
};
export type OldHistoryEntryContent = {
  lastStatus: boolean;
  lastStatusChangeDateText: OldHistoryEntryText;
};
export type CurrentStatusContent = {
  statusText: string;
  formattedDateText: string;
  statusPrediction: string;
  history: HistoryEntryContent[] | OldHistoryEntryContent;
};

export type MillisecondsPassed = number;
