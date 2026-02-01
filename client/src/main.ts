import { constructHistoryEntry } from "./historyEntry";
import "./style.css";

export type HistoryEntry = {
  changedToStatus: boolean;
  dateOfChange: string;
};

type FullStatus = {
  status: boolean;
  lastCheckDate: string;
  lastCheckStatus: boolean;
  history: HistoryEntry[];
};

type StatusContent = {
  statusText: string;
  formattedDateText: string;
  history: HistoryEntry[];
};

const statusElement = document.querySelector<HTMLHeadingElement>(".status-info")!;
const statusCheckDateElement = document.querySelector<HTMLHeadingElement>(".status-last-check")!;
const historyListElement = document.querySelector<HTMLUListElement>(".history-list")!;

async function fetchStatusData(): Promise<FullStatus | undefined> {
  const apiUrl: string = "/api/v1/status";

  try {
    const response = await fetch(apiUrl);
    console.log(response);
    if (!response.ok) {
      throw new Error(`Energy status request failed. Status: ${response.status}`);
    }
    const { fullStatus: data }: { fullStatus: FullStatus } = await response.json();

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? console.log(error.message) : "Unknown error";
    console.log(errorMessage);
  }
}

async function updateStatusOnScreen() {
  const newStatus = await fetchStatusData();
  const statusContent: StatusContent = {
    statusText: "",
    formattedDateText: "",
    history: [],
  };
  console.log(newStatus);
  if (!newStatus) {
    statusContent.statusText = "Немає зв'язку з сервером. Спробуйте пізніше.";
  } else {
    statusContent.statusText = newStatus.status ? "Світло є" : "Світла нема";
    const formattedDate: string = new Date(newStatus.lastCheckDate).toLocaleTimeString("uk-UA", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      minute: "2-digit",
    });
    statusContent.formattedDateText = `Остання перевірка була о ${formattedDate}`;
    statusContent.history = newStatus.history;
  }

  statusElement.textContent = statusContent.statusText;
  statusCheckDateElement.textContent = statusContent.formattedDateText;

  statusContent.history.forEach((entry) => {
    const historyEntryElement = document.createElement("li");

    historyListElement.appendChild(constructHistoryEntry(historyEntryElement, entry));
  });
}

await updateStatusOnScreen();
