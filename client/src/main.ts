import "./style.css";
import {
  currentStatus,
  millisecondsPassed,
  updateLastCheckDate,
  updateStatusData,
} from "./getData";
import { updateStatusOnScreen } from "./updateScreen";

// show default text
updateStatusOnScreen();
// fetch data and update screen accordingly
await updateStatusData();
updateStatusOnScreen();

let secondsPassedSinceLastTry = 0;

// set up interval to show how many seconds passed since last check and fetch updated data every 60 seconds
setInterval(() => {
  updateLastCheckDate();
  updateStatusOnScreen();
  if (millisecondsPassed > 60000) {
    if (!currentStatus.maintenance) {
      updateStatusData();
    } else {
      secondsPassedSinceLastTry++;
      if (secondsPassedSinceLastTry >= 60) {
        updateStatusData();
        secondsPassedSinceLastTry = 0;
      }
    }
  }
}, 1000);
