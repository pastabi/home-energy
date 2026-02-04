import type { HistoryEntryContent } from "./types";

export function constructHistoryEntry(
  historyEntryElement: HTMLLIElement,
  statusEntry: HistoryEntryContent,
): HTMLLIElement {
  const {
    statusDuration: { statusHeight, durationText },
    thisStatus: { toStatus, timeText },
  } = statusEntry;

  const statusColor = toStatus ? "#fff080" : "#213547";

  const dayStartHeight = statusEntry.dayChange ? statusEntry.dayChange.dayStartHeight : 0;
  const weekdayText = statusEntry.dayChange ? statusEntry.dayChange.weekdayText : "";

  console.log(dayStartHeight);

  historyEntryElement.innerHTML = `
  <div style="position: relative; padding-top: ${+statusHeight}px; border-left: 2px solid ${statusColor};">
  <div style="position: relative; bottom: ${+dayStartHeight}px">${weekdayText}</div>
  <div style="position: relative; text-align: center; bottom: ${statusHeight / 2}px">${toStatus ? "світло було " : "світла не було "}${durationText}</div>
  <span>${toStatus ? "увімкнули о " : "вимкнули о "}</span>
  <span>${timeText}</span>
  </div>`;

  return historyEntryElement;
}
