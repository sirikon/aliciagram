import { createServer } from "http";
import { Telegraf } from "telegraf";
import { KeyboardButton } from "telegraf/typings/core/types/typegram";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

const BUTTON_COLUMNS = 2;
const DICE_COMMAND = "Ay no se";
const ONOMATOPEIAS = [
  "Miau Miau",
  "Tuturu",
  "Tirititi",
  "Pium Pium",
  "Pipoto",
  "Pupupu",
  "Wluwluwlu🦃🦃",
  "Bllbllbl🐙🐙",
];
const ALLOWED_MESSAGES = [...ONOMATOPEIAS, DICE_COMMAND];
const ALLOWED_USERS: Record<string, number> = Object.fromEntries(
  (process.env.ALICIAGRAM_ALLOWED_USERS || "").split(";").map((chunk) => {
    const [user, chatId] = chunk.split(":");
    return [user, parseInt(chatId)];
  })
);

if (!process.env.ALICIAGRAM_BOT_TOKEN)
  throw new Error("ALICIAGRAM_BOT_TOKEN env var is missing");

const bot = new Telegraf(process.env.ALICIAGRAM_BOT_TOKEN);

bot.start(async (ctx) => {
  const user = getMatchingUser(ctx.chat.id);
  if (user == null) return;
  await ctx.reply("👋", replyKeyboardWithButtons(ALLOWED_MESSAGES));
});

bot.on("text", async (ctx) => {
  const message = ctx.message.text;
  if (message === "dime quien soy") {
    await ctx.reply(ctx.chat.id.toString());
    return;
  }

  const user = getMatchingUser(ctx.chat.id);
  if (user == null) return;

  if (ALLOWED_MESSAGES.indexOf(message) === -1) {
    await ctx.reply(
      "???? usa los botoncitos, mi no entender 🤷",
      replyKeyboardWithButtons(ALLOWED_MESSAGES)
    );
    return;
  }

  if (message === DICE_COMMAND) {
    await ctx.replyWithDice(replyKeyboardWithButtons(ALLOWED_MESSAGES));
    return;
  }

  for (const [_, chatId] of Object.entries(ALLOWED_USERS)) {
    if (chatId === ctx.chat.id) continue;
    await bot.telegram.sendMessage(
      chatId,
      `${user}: ${message}`,
      replyKeyboardWithButtons(ALLOWED_MESSAGES)
    );
  }
});

function replyKeyboardWithButtons(buttons: string[]): ExtraReplyMessage {
  const keyboardButtons: KeyboardButton[][] = [];

  for (let i = 0; i < buttons.length; i += BUTTON_COLUMNS) {
    const row: KeyboardButton[] = [];
    for (let x = 0; x < BUTTON_COLUMNS; x++) {
      const text = buttons[i + x];
      if (text != null) {
        row.push({ text });
      }
    }
    keyboardButtons.push(row);
  }

  return {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
    },
  };
}

function getMatchingUser(chatId: number): string | null {
  const matches = Object.entries(ALLOWED_USERS).find(
    ([_, id]) => chatId === id
  );
  return matches ? matches[0] : null;
}

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

if (process.env.ALICIAGRAM_USE_POOLING === "true") {
  bot.launch();
} else {
  bot.createWebhook({ domain: "aliciagram.srk.bz" }).then((webhook) => {
    createServer(webhook).listen(80);
  });
}
