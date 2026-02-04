import type { HistoryEntryContent, WeekdayContent } from "./types";

function createDayStartDivs(weekdays: WeekdayContent[]): string {
  const divs = weekdays.reduce((prev, curr) => {
    const { dayStartHeight, weekdayText } = curr;
    return prev.concat(
      `<div style="position: relative; bottom: ${dayStartHeight}px">${weekdayText}</div>`,
    );
  }, "");

  return divs;
}

export function constructHistoryEntry(
  historyEntryElement: HTMLLIElement,
  statusEntry: HistoryEntryContent,
  entryIndex: number,
): HTMLLIElement {
  const {
    statusDuration: { statusHeight, durationText },
    thisStatus: { toStatus, timeText },
    dayChange,
  } = statusEntry;

  const statusColor = toStatus ? "#fff080" : "#213547";

  const weekdaysDivs = !dayChange ? "" : createDayStartDivs(dayChange);
  // generate text strings
  const statusDurationText = `${entryIndex > 0 ? (toStatus ? "світло було " : "світла не було ") : toStatus ? "світло є вже " : "світла нема вже "}${durationText}`;
  const statusTimeText = `${toStatus ? "увімкнули о " : "вимкнули о "}${timeText}`;

  historyEntryElement.innerHTML = `
  <div style="position: relative; padding-top: ${statusHeight}px; border-left: 2px solid ${statusColor};">
  ${weekdaysDivs}
  <div style="position: relative; text-align: center; bottom: ${statusHeight / 2}px">${statusDurationText}</div>
  <span>${statusTimeText}</span>
  </div>`;

  return historyEntryElement;
}

export function constructLastEntry(
  lastEntryElement: HTMLLIElement,
  lastStatusEntry: HistoryEntryContent,
): HTMLLIElement {
  const {
    thisStatus: { toStatus },
    ifLastEntry: { lastEntryHeight, lastEntryText },
  } = lastStatusEntry;

  const statusColor = !toStatus ? "#fff080" : "#213547";

  lastEntryElement.innerHTML = `
  <div style="position: relative; padding-top: ${lastEntryHeight}px; border-left: 2px solid ${statusColor};">
  <span>${lastEntryText}</span>
  </div>`;

  return lastEntryElement;
}
