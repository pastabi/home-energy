import { currentStatusContent } from "./getData";
import { constructHistoryEntry, constructLastEntry } from "./constructHistory";

const statusElement = document.querySelector<HTMLHeadingElement>(".status-info")!;
const statusCheckDateElement = document.querySelector<HTMLHeadingElement>(".status-last-check")!;
const historyListElement = document.querySelector<HTMLUListElement>(".history-list")!;
const predictionTextElement = document.querySelector<HTMLParagraphElement>(".status-prediction")!;

let lastHistoryHash = "";

// called every minute
// updates elements on the screen based on new state
export function updateStatusOnScreen() {
  // status block
  statusElement.textContent = currentStatusContent.statusText;
  statusCheckDateElement.textContent = currentStatusContent.formattedDateText;
  predictionTextElement.textContent = currentStatusContent.statusPrediction;

  // history block
  // as we call this function every second, we will check, if anything change in history
  // history will only change every 60 seconds, so other seconds there will be no these heavy calculations
  const currentHistoryHash = JSON.stringify(currentStatusContent.history);
  if (currentHistoryHash === lastHistoryHash) return;
  lastHistoryHash = currentHistoryHash;

  historyListElement.replaceChildren();

  currentStatusContent.history.forEach((entry, entryIndex) => {
    const historyEntryElement = document.createElement("li");

    historyListElement.appendChild(constructHistoryEntry(historyEntryElement, entry, entryIndex));
  });

  const lastHistoryElement = document.createElement("li");
  const lastHistoryEntry = currentStatusContent.history.at(-1);
  if (lastHistoryEntry)
    historyListElement.appendChild(constructLastEntry(lastHistoryElement, lastHistoryEntry));
}
