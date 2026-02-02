import { getData } from "./getData";
import "./style.css";
import { updateStatusOnScreen } from "./updateScreen";

// on page load staring data load, while loading showing a placeholder
// (let) calculating how much time passed since the last check (+5 seconds)
// setting up the interval that will run every second and callback will do 2 things
// ACTION 1 - DISPLAY
// - will count how much seconds pass since the last status check and display it
// ACTION 2 - CHECK CONDITION
// - will check if 60 seconds passed since the last check, if so, it will call 2 functions
// await getData() - will fetch the data and assign it to appropriate global variables
// updateScreen() - will update the content on the screen with the new data
// calculate and reset time since the last check

updateStatusOnScreen();
await getData();
updateStatusOnScreen();
