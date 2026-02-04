import { currentStatusContent } from "./getData";
import { constructHistoryEntry } from "./historyEntry";

const statusElement = document.querySelector<HTMLHeadingElement>(".status-info")!;
const statusCheckDateElement = document.querySelector<HTMLHeadingElement>(".status-last-check")!;
const historyListElement = document.querySelector<HTMLUListElement>(".history-list")!;
const predictionTextElement = document.querySelector<HTMLParagraphElement>(".status-prediction")!;

// potentially there will be simple constructHistoryEntry function that will constructs history elements from ready for use data from currentStatusContent

// called every second
// separating last check time update to not call full updateStatusOnScreen every second
export function updateLastCheckDateOnScreen() {
  statusCheckDateElement.textContent = currentStatusContent.formattedDateText;
}

// updates elements on the screen based on new state
export function updateStatusOnScreen() {
  statusElement.textContent = currentStatusContent.statusText;
  updateLastCheckDateOnScreen();
  predictionTextElement.textContent = currentStatusContent.statusPrediction;

  currentStatusContent.history.forEach((entry) => {
    const historyEntryElement = document.createElement("li");

    historyListElement.appendChild(constructHistoryEntry(historyEntryElement, entry));
  });
}
