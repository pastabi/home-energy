import { currentStatus, currentStatusContent } from "./getData";
import { constructHistoryEntry, constructLastEntry, constructOldEntry } from "./constructHistory";

const statusElement = document.querySelector<HTMLHeadingElement>(".status-info")!;
const statusCheckDateElement = document.querySelector<HTMLHeadingElement>(".status-last-check")!;
const historyListElement = document.querySelector<HTMLUListElement>(".history-list")!;
const messageTextElement = document.querySelector<HTMLParagraphElement>(".message")!;

let lastHistoryHash = "";

function updateColors() {
  const sunData = currentStatus.sun;
  const htmlElement = document.documentElement;
  const statusContainerElement = document.querySelector<HTMLDivElement>(".status-container")!;

  if (sunData.sunrise === "") return;

  if (
    Date.now() < new Date(sunData.sunrise).getTime() ||
    Date.now() > new Date(sunData.sunset).getTime()
  )
    htmlElement.setAttribute("data-theme", "night");
  else htmlElement.setAttribute("data-theme", "day");

  if (currentStatus.status) statusContainerElement.setAttribute("data-status", "true");
  else statusContainerElement.setAttribute("data-status", "false");
}

// called every minute
// updates elements on the screen based on new state
export function updateStatusOnScreen() {
  updateColors();

  // status block
  statusElement.textContent = currentStatusContent.statusText;
  statusCheckDateElement.textContent = currentStatusContent.formattedDateText;
  let messageText: string;
  if (currentStatusContent.messageText.length > 0) messageText = currentStatusContent.messageText;
  else messageText = currentStatusContent.statusPrediction;
  messageTextElement.textContent = messageText;

  // history block
  // as we call this function every second, we will check, if anything change in history
  // history can only change every 60 seconds, so other seconds there will be no these heavy calculations
  const currentHistoryHash = JSON.stringify(currentStatusContent.history);
  if (currentHistoryHash === lastHistoryHash) return;
  lastHistoryHash = currentHistoryHash;

  historyListElement.replaceChildren();

  if (Array.isArray(currentStatusContent.history)) {
    currentStatusContent.history.forEach((entry, entryIndex) => {
      const historyEntryElement = document.createElement("li");

      historyListElement.appendChild(constructHistoryEntry(historyEntryElement, entry, entryIndex));
    });

    const lastHistoryElement = document.createElement("li");
    const lastHistoryEntry = currentStatusContent.history.at(-1);
    if (lastHistoryEntry)
      historyListElement.appendChild(constructLastEntry(lastHistoryElement, lastHistoryEntry));
  } else {
    const historyEntryElement = document.createElement("li");

    historyListElement.appendChild(
      constructOldEntry(historyEntryElement, currentStatusContent.history),
    );
  }
}
