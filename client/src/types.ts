export type HistoryEntry = {
  changedToStatus: boolean;
  dateOfChange: string;
};

export type CurrentStatus = {
  status: boolean;
  lastCheckDate: string;
  lastCheckStatus: boolean;
  history: HistoryEntry[];
};

export type HistoryEntryContent = {
  // height: next status timestamp - this status timestamp / coef
  // text: mm or hh:mm on this status
  statusDuration: { statusHeight: number; durationText: string };
  // height: day change timestamp - this state timestamp / coef
  // text: date and day of the week starting
  dayChange: { dayStartHeight: number; weekdayText: string } | false;
  // just time string in hh:mm format and to which status changed
  thisStatus: { toStatus: boolean; timeText: string };
};

export type CurrentStatusContent = {
  statusText: string;
  formattedDateText: string;
  statusPrediction: string;
  history: HistoryEntryContent[];
};

export type MillisecondsPassed = number;
