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

export type CurrentStatusContent = {
  statusText: string;
  formattedDateText: string;
  history: HistoryEntry[];
};

export type MillisecondsPassed = number;
