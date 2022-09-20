import { Telegraf } from "telegraf";
import { KeyboardButton } from "telegraf/typings/core/types/typegram";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

const DICE_COMMAND = "Ay no se";
const ONOMATOPEIAS = [
  "Miau Miau",
  "Tuturu",
  "Tirititi",
  "Pium Pium",
  "Pipoto",
  "Pupupu",
];
const ALLOWED_MESSAGES = [...ONOMATOPEIAS, DICE_COMMAND];
const ALLOWED_USERS: Record<string, number> = {
  Carlos: 3455205,
};

if (!process.env.ALICIAGRAM_BOT_TOKEN)
  throw new Error("ALICIAGRAM_BOT_TOKEN env var is missing");

const bot = new Telegraf(process.env.ALICIAGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  const user = getMatchingUser(ctx.chat.id);
  if (user == null) return;

  const message = ctx.message.text;

  if (ALLOWED_MESSAGES.indexOf(message) === -1) {
    await ctx.reply(
      "???? usa el teclao",
      replyKeyboardWithButtons(ALLOWED_MESSAGES)
    );
    return;
  }

  if (message === DICE_COMMAND) {
    await ctx.replyWithDice(replyKeyboardWithButtons(ALLOWED_MESSAGES));
    return;
  }

  for (const [_, chatId] of Object.entries(ALLOWED_USERS)) {
    await bot.telegram.sendMessage(
      chatId,
      `${user}: ${message}`,
      replyKeyboardWithButtons(ALLOWED_MESSAGES)
    );
  }
});

function replyKeyboardWithButtons(buttons: string[]): ExtraReplyMessage {
  return {
    reply_markup: {
      keyboard: buttons.map((b): KeyboardButton[] => [{ text: b }]),
      resize_keyboard: true,
    },
  };
}

function getMatchingUser(chatId: number): string | null {
  const matches = Object.entries(ALLOWED_USERS).find(
    ([n, id]) => chatId === id
  );
  return matches ? matches[0] : null;
}

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
