import { currentStatusContent } from "./getData";
import { constructHistoryEntry } from "./historyEntry";

const statusElement = document.querySelector<HTMLHeadingElement>(".status-info")!;
const statusCheckDateElement = document.querySelector<HTMLHeadingElement>(".status-last-check")!;
const historyListElement = document.querySelector<HTMLUListElement>(".history-list")!;

export function updateStatusOnScreen() {
  statusElement.textContent = currentStatusContent.statusText;
  statusCheckDateElement.textContent = currentStatusContent.formattedDateText;

  currentStatusContent.history.forEach((entry) => {
    const historyEntryElement = document.createElement("li");

    historyListElement.appendChild(constructHistoryEntry(historyEntryElement, entry));
  });
}
