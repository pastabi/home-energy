import express, { Request, Response } from "express";
import "dotenv/config";
const url = process.env.HOME_URL;
const port = process.env.PORT || 5001;

const app = express();

let lastStatus = {
  status: await checkEnergy(),
  lastCheckTime: new Date(),
};

setInterval(async () => {
  lastStatus.status = await checkEnergy();
  lastStatus.lastCheckTime = new Date();
}, 60000);

async function checkEnergy() {
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

app.get("/", async (req: Request, res: Response) => {
  const energyStatus = lastStatus.status;

  const statusText = energyStatus ? "Світло є" : "Cвітла нема";
  const statusStyle = energyStatus ? "color: green" : "color: red";

  const formattedTime: string = lastStatus.lastCheckTime.toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
  });

  res.send(`
    <h2 style="text-align: center; margin-top: 20px">Статус світла:</h2>
    <h1 style="${statusStyle}; text-align: center">${statusText}</h1>
    <h4 style="text-align: center;">Остання перевірка була о ${formattedTime}</h4>`);
});

app.listen(port, () => console.log(`server is listening on port: ${port}`));
