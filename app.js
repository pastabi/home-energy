import express from "express";
import "dotenv/config";

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
    const responce = await fetch(process.env.HOME_URL, {
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

app.get("/", async (req, res) => {
  const energyStatus = lastStatus.status;

  const statusText = energyStatus ? "Світло є" : "Cвітла нема";
  const statusStyle = energyStatus ? "color: green" : "color: red";

  const lastCheckDate = lastStatus.lastCheckTime.toLocaleString("uk-UA").split(", ");
  let lastCheckLocalTime = lastCheckDate.at(1).split(":");
  lastCheckLocalTime.pop();
  lastCheckLocalTime = lastCheckLocalTime.join(":");

  res.send(`
    <h2 style="text-align: center; margin-top: 20px">Статус світла:</h2>
    <h1 style="${statusStyle}; text-align: center">${statusText}</h1>
    <h4 style="text-align: center;">Остання перевірка була о ${lastCheckLocalTime}</h4>`);
});

const port = process.env.PORT || 5001;

app.listen(port, console.log(`server is listening on port: ${port}`));
