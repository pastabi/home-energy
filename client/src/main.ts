import "./style.css";
import { millisecondsPassed, updateLastCheckDate, updateStatusData } from "./getData";
import { updateStatusOnScreen } from "./updateScreen";

// show default text
updateStatusOnScreen();
// fetch data and update screen accordingly
await updateStatusData();
updateStatusOnScreen();

// set up interval to show how many seconds passed since last check and fetch updated data every 60 seconds
setInterval(async () => {
  updateLastCheckDate();
  updateStatusOnScreen();
  if (millisecondsPassed > 60000) {
    updateStatusData();
  }
}, 1000);
