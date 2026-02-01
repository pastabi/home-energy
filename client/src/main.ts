import "./style.css";

type EnergyStatus = {
  status: boolean;
  lastCheckDate: string;
};

const statusElement = document.querySelector<HTMLHeadingElement>(".status-info")!;
const statusCheckDateElement = document.querySelector<HTMLHeadingElement>(".status-last-check")!;

async function fetchStatusData(): Promise<EnergyStatus | undefined> {
  const apiUrl: string = "/api/v1/status";

  try {
    const response = await fetch(apiUrl);
    console.log(response);
    if (!response.ok) {
      throw new Error(`Energy status request failed. Status: ${response.status}`);
    }
    const { fullStatus: data }: { fullStatus: EnergyStatus } = await response.json();

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? console.log(error.message) : "Unknown error";
    console.log(errorMessage);
  }
}

async function updateStatusOnScreen() {
  const newStatus = await fetchStatusData();
  if (!newStatus) return;
  else {
    statusElement.textContent = newStatus.status ? "Світло є" : "Світла нема";
    const formattedDate: string = new Date(newStatus.lastCheckDate).toLocaleTimeString("uk-UA", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log("");
    statusCheckDateElement.textContent = `Остання перевірка була о ${formattedDate}`;
  }
}

await updateStatusOnScreen();
