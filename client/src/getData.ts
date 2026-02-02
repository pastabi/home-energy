import type { CurrentStatus, CurrentStatusContent, MillisecondsPassed } from "./types";

// ----- DATA ZONE START -----
export const currentStatus: CurrentStatus = {
  status: false,
  lastCheckDate: "",
  lastCheckStatus: false,
  history: [],
};

export const currentStatusContent: CurrentStatusContent = {
  statusText: "Loading...",
  formattedDateText: "",
  history: [],
};

export let millisecondsPassed: MillisecondsPassed = 0;
// ----- DATA ZONE END -----

// ----- FUNCTIONS ZONE START -----
async function fetchStatusData(): Promise<CurrentStatus | undefined> {
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

export function updateMillisecondsPassed() {
  const lastCheckDate: number = new Date(currentStatus.lastCheckDate).getDate();
  const now: number = Date.now();
  millisecondsPassed = now - lastCheckDate;
}

function createLastCheckDateText(): void {
  const formattedDate: string = new Date(currentStatus.lastCheckDate).toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
  });

  const secondsPassed = Math.floor(millisecondsPassed / 1000);
  const lastCheckString = `Остання перевірка була ${secondsPassed} cек. назад (о ${formattedDate})`;
  currentStatusContent.formattedDateText = lastCheckString;
}

export async function getData() {
  const data = await fetchStatusData();
  if (!data) return;
  currentStatus.status = data.status;
  currentStatus.lastCheckDate = data.lastCheckDate;
  currentStatus.lastCheckStatus = data.lastCheckStatus;
  currentStatus.history = data.history;

  currentStatusContent.history = currentStatus.history;
  currentStatusContent.statusText = currentStatus.status ? "Світло є" : "Світла нема";
  createLastCheckDateText();
}

// ----- FUNCTIONS ZONE END -----
