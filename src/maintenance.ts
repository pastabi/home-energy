import express from "express";
import { htmlTemplate } from "./utils.js";
import fullStatus, { deleteEntriesFromHistoryStorage } from "./statusStorage.js";
import { setupMonitoring } from "./monitor.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const userToken = req.query.token as string;
  const deleteHistoryEntries = req.query.delete as string;
  const secretToken = process.env.MAINTENANCE_TOKEN;

  if (!secretToken)
    return res
      .status(500)
      .send(htmlTemplate("<p>Для початку треба налаштувати токен на сервері.</p>"));
  if (!userToken || userToken !== secretToken)
    return res
      .status(403)
      .send(htmlTemplate("<p>Неправильний токен. Перевірте токен та спробуйте ще раз.</p>"));

  let message: string = "";
  let status: number = 200;

  if (!deleteHistoryEntries) {
    fullStatus.maintenance = !fullStatus.maintenance;
    setupMonitoring();

    if (fullStatus.maintenance) message = "Режим технічних робіт активовано.";
    if (!fullStatus.maintenance)
      message = "Режим технічних робіт деактивовано, сервер працює в штатному режимі.";
  } else {
    const start = Number(deleteHistoryEntries.split(",").at(0));
    const count = Number(deleteHistoryEntries.split(",").at(1));
    if (isNaN(start) || isNaN(count) || start < 0 || count < 0) {
      status = 400;
      message = "Невірний формат. Введіть два додатних числа через кому.";
    } else {
      const deletionSuccess = await deleteEntriesFromHistoryStorage(Number(start), Number(count));
      if (deletionSuccess)
        message = `Було видалено записів з історії: ${count}. Перейдіть на головну сторінку щоб перевірити результат.`;
      else {
        status = 400;
        message =
          "Щось пішло не так. Записи не було видалено. Перевірте введені значення та спробуйте ще раз.";
      }
    }
  }

  const htmlContent = `
    <p style="font-weight: bold; font-size: 1.5rem; margin-bottom: 32px; margin-top: 8px">${message}</p>
    <p style="font-size: 1.2rem; margin-bottom: 32px">
      <a style="color: #dce0ea; font-weight: 400;" href="/api/v1/maintenance?token=${secretToken}">${fullStatus.maintenance ? "Деактивувати режим технічних робіт" : "Активувати режим технічних робіт"}</a>
    </p>
    <p style="font-size: 1.2rem; margin-bottom: 32px">
      <a style="color: #dce0ea; font-weight: 400;" href="/">На головну<a>
    <p>
  `;

  res.status(status).send(htmlTemplate(htmlContent));
});

export default router;
