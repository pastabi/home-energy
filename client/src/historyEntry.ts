import type { HistoryEntry } from "./types";

export function constructHistoryEntry(
  historyEntryElement: HTMLLIElement,
  statusEntry: HistoryEntry,
): HTMLLIElement {
  const date = new Date(statusEntry.dateOfChange);
  const options = { timeZone: "Europe/Kyiv" };

  const time: string = date.toLocaleTimeString("uk-UA", {
    ...options,
    hour: "2-digit",
    minute: "2-digit",
  });
  const dayMonth: string | undefined = date
    .toLocaleTimeString("uk-UA", {
      ...options,
      day: "numeric",
      month: "numeric",
    })
    .split(",")
    .at(0);

  historyEntryElement.innerHTML = `<span>${statusEntry.changedToStatus ? "Світло увімкнули о " : "Світло вимкнули о "}</span><span>${time}, ${dayMonth}</span>`;

  return historyEntryElement;
}
