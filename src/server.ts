import express, { Request, Response } from "express";
import "dotenv/config";
const url = process.env.HOME_URL;
const port = process.env.PORT || 5001;
import path from "path";

const app = express();

type LastStatus = {
  status: boolean;
  lastCheckDate: Date;
};
let lastStatus: LastStatus = {
  status: await checkEnergy(),
  lastCheckDate: new Date(),
};

setInterval(async () => {
  lastStatus.status = await checkEnergy();
  lastStatus.lastCheckDate = new Date();
}, 60000);

async function checkEnergy(): Promise<boolean> {
  try {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), 5000);
    if (!url) throw new Error("HOME_URL is not defined in .env file");

    const responce = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (responce.status === 401) return true;
    if (responce.status === 200) return true;
    return false;
  } catch (error) {
    return false;
  }
}

app.use(express.json());

app.use(express.static("./client/dist"));

app.get("/api/v1/status", (req: Request, res: Response) => {
  res.status(200).json({ lastStatus });
});
app.get("/{*any}", (req: Request, res: Response) => {
  res.status(404).sendFile(path.resolve("./client/dist/index.html"));
});

app.listen(port, () => console.log(`server is listening on port: ${port}`));
