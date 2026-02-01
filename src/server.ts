import express, { Request, Response } from "express";
import "dotenv/config";
import path from "path";
import updateStatus from "./monitor.js";
import fullStatus, { setFullStatusFromHistory } from "./statusStorage.js";

const app = express();

// retrieves status from file to get something to show before the first check
await setFullStatusFromHistory();
// console.log(fullStatus);

setInterval(async () => {
  await updateStatus();
}, 60000);

app.use(express.static("./client/dist"));

app.get("/api/v1/status", (req: Request, res: Response) => {
  res.status(200).json({ fullStatus });
});
app.get("/{*any}", (req: Request, res: Response) => {
  res.status(404).sendFile(path.resolve("./client/dist/index.html"));
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`server is listening on port: ${port}`));
