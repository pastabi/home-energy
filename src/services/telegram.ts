import { Bot, GrammyError, HttpError } from "grammy";
import fullStatus from "../statusStorage.js";
import { addUser, deleteUser, getAllUsers } from "./userStorageOperations.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is unset");

export const telegramBot = new Bot(token);

telegramBot.command("start", async (ctx) => {
  const chatId = ctx.chat.id;
  const username = ctx.chat.username || "Anon";

  try {
    await addUser({ username, chatId });
    const energyStatus = fullStatus.status;
    const lastCheckMinutesAgo = Math.floor(
      (Date.now() - fullStatus.lastCheckDate.getTime()) / 1000 / 60,
    );
    const message = `Ви підписались на сповіщення про світло у нас дома! 
${energyStatus ? "Зараз світло є." : "Зараз світла нема."}
Остання перевірка була ${lastCheckMinutesAgo === 0 ? "<1" : lastCheckMinutesAgo} хв назад.
Я повідомлю якщо щось зміниться.
Якщо хочете отримувати сповіщення про це, увімкніть сповіщення від цього боту.    
`;
    await ctx.reply(message);
    console.log(`New subscriber: ${username} (${chatId})`);
  } catch (error) {
    console.log("Error saving user: ", error);
  }
});

export async function notifyAllUsers(message: string): Promise<void> {
  const users = await getAllUsers();

  for (const user of users) {
    try {
      await telegramBot.api.sendMessage(user.chatId, message);
    } catch (error) {
      if (error instanceof GrammyError) {
        // if user blocks the bot, delete the user from our list
        if (error.description.includes("blocked")) {
          console.log(`User ${user.chatId} blocked the bot.`);
          await deleteUser(user.chatId);
        } else console.log(`Telegram API Error: ${error.description}`);
      } else if (error instanceof HttpError) {
        console.error(`Could not contact Telegram: ${error.message}`);
      } else {
        console.error("Unknown error:", error);
      }
    }
  }
}
