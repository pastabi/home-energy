import type { HistoryEntryContent, WeekdayContent } from "./types";

const lineHeight = 24; // 24px = 1.5, specified value for line-height in root style
const ligthColor = "#fff080";
const darkColor = "#213547";

function createWeekdayStartDivs(
  weekdays: WeekdayContent[],
  rawStatusHeight: number,
  baseHeight: number,
): string {
  const divs = weekdays.reduce((prev, curr, index) => {
    const { dayStartHeight: actualWeekdayStart, weekdayText, weekdayISOTime } = curr;
    let normalizedWeekdayStart = Math.ceil(actualWeekdayStart);
    // the number that will consider the base height
    let weekdayStart = 0;

    // checking how close the weekday to the next entry
    const diff = rawStatusHeight - normalizedWeekdayStart;

    if (normalizedWeekdayStart <= baseHeight) weekdayStart = 0;
    else {
      // every new day inside a history entry will stack and add to its starting point
      // so we need to consider it by substracting the base of this specific day
      weekdayStart = normalizedWeekdayStart - lineHeight * (weekdays.length - index);

      // if the day start is too close to the next entry, we move it down, so they not overlap
      if (diff < lineHeight) {
        weekdayStart = weekdayStart - (lineHeight - diff);
      }
    }
    const weekdayStyle = `
      display: block; 
      position: relative; 
      bottom: ${weekdayStart}px;
    `;

    return prev.concat(
      `<time datetime="${weekdayISOTime}" style="${weekdayStyle}">${weekdayText}</time>`,
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
    thisStatus: { toStatus, timeText, statusISOTime },
    dayChange,
  } = statusEntry;

  const statusColor = toStatus ? ligthColor : darkColor;

  // create a base height of elements in this entry
  // until this value is exceeded by the statusHeight no movement is allowed
  // we always have 2 elements in entry: status start and status duration
  // and may have _dayChange.length_ weekday start elements
  let baseHeight = 0;
  if (Array.isArray(dayChange)) {
    baseHeight = (dayChange.length + 2) * lineHeight;
  } else baseHeight = 2 * lineHeight;

  // to remove numbers after digtal point
  let normalizedStatusHeight = Math.ceil(statusHeight);
  // the value that will be used in the style to add padding to the top
  let addedStatusHeight = 0;
  let statusDurationStart = 0;

  // based on _baseHeight_ and _normalizedStatusHeight_ calculate _addedStatusHeight_ value
  addedStatusHeight = normalizedStatusHeight > baseHeight ? normalizedStatusHeight - baseHeight : 0;

  // place status duration at the middle of _addedStatusHeight_
  statusDurationStart = addedStatusHeight / 2;

  // handling cases when day change text overlaps with status duration text
  // considering changes only if movement is allowed (addedStatusHeight>0)
  if (Array.isArray(dayChange) && addedStatusHeight > 0) {
    // status duration is last element in list of blocks, so it's starting point is base height minus it's own height
    const actualStatusDurationStart = baseHeight - lineHeight + statusDurationStart;
    for (let day of dayChange) {
      let normalizedWeekdayStart = Math.ceil(day.dayStartHeight);

      // considering the fact that weekday text can be shifted bottom to not overlap with next status
      const topDiff = normalizedStatusHeight - normalizedWeekdayStart;
      if (normalizedWeekdayStart > baseHeight && topDiff < lineHeight) {
        normalizedWeekdayStart = normalizedWeekdayStart - (lineHeight - topDiff);
      }

      const diff = actualStatusDurationStart - normalizedWeekdayStart;

      if (diff < lineHeight && diff > 0) {
        statusDurationStart += lineHeight - diff;
      } else if (diff > -lineHeight && diff <= 0) {
        statusDurationStart -= lineHeight + diff;
      }
    }
  }

  // STYLES
  const containerStyle = `
    position: relative;
    padding-top: ${addedStatusHeight}px; 
    padding-left: 6px;
    border-left: 4px solid ${statusColor};
  `;
  const statusDurationStyle = `
    position: relative;
    text-align: center; 
    bottom: ${statusDurationStart}px
  `;
  const statusTextStyle = `
    position: relative;
  `;

  // TEXT
  const statusDurationText = `${
    entryIndex !== 0
      ? toStatus
        ? "світло було "
        : "світла не було "
      : toStatus
        ? "світло є вже "
        : "світла нема вже "
  }${durationText}
  `;
  const statusTimeText = `${
    toStatus ? "увімкнули о " : "вимкнули о "
  }<time datetime="${statusISOTime}">${timeText}</time>
  `;

  // FULL ELEMENTS
  const weekdayDivs = !dayChange
    ? ""
    : createWeekdayStartDivs(dayChange, normalizedStatusHeight, baseHeight);

  historyEntryElement.innerHTML = `
  <div style="${containerStyle}">
    <p style="${statusDurationStyle}">${statusDurationText}</p>
    ${weekdayDivs}
    <p style="${statusTextStyle}">${statusTimeText}</p>
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
  const normalizedLastEntryHeight = Math.ceil(lastEntryHeight);

  const statusColor = !toStatus ? ligthColor : darkColor;

  const lastEntryStyle = `
  position: relative; 
  padding-top: ${normalizedLastEntryHeight - lineHeight}px; 
  padding-left: 6px;
  border-left: 4px solid ${statusColor};
  `;

  lastEntryElement.innerHTML = `
  <div style="${lastEntryStyle}">
  <p>${lastEntryText}</p>
  </div>`;

  return lastEntryElement;
}
