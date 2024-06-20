import dotenv from "dotenv";
import fs from "fs";

import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { formatForecast } from "./utils";
import { getUserInfo } from "./userInfo";
import getForecast from "./getForecast";

dotenv.config();

// const MAIN_KEYBOARD = [
//   [{ text: msg.ficharSalida7h15m, callback_data: "ficharSalida7h15m" }],
//   [{ text: msg.ficharSalida7h30m, callback_data: "ficharSalida7h30m" }],
//   [{ text: msg.ficharSalida, callback_data: "ficharSalida" }],
//   [{ text: msg.check, callback_data: "check" }],
// ];

const MAIN_KEYBOARD = Markup.keyboard([
  ["Ver mi suscripción"],
  [Markup.button.locationRequest("Consultar tiempo actual")],
  ["Actualizar localización"],
  ["Actualizar hora"],
]);

(async () => {
  // const timeoutMs = calculateMsForTimeout(process.env.TIME_TO_LAUNCH as string);
  let userInfo = getUserInfo();

  try {
    const bot = new Telegraf(process.env.BOT_TOKEN as string);
    console.log("Bot iniciado");

    // Middleware to check chat ID
    bot.use((ctx, next) => {
      if (ctx.chat?.id.toString() === process.env.ALLOWED_CHAT_ID) {
        return next();
      }
    });

    bot.start((ctx) => {
      ctx.reply(
        "¡Hola Javi! Bienvenido al bot encargado del servicio del tiempo. ¿Qué te gustaría hacer?",
        MAIN_KEYBOARD
      );
    });

    bot.hears("Ver mi suscripción", async (ctx) => {
      await ctx.reply(
        `Te enviamos la información del tiempo todos los días a las ${userInfo.time}`
      );
      await ctx.replyWithLocation(userInfo.lat, userInfo.lon);
    });

    bot.hears("Actualizar localización", (ctx) => {
      ctx.reply("You selected Actualizar localización");
    });

    bot.hears("Actualizar hora", (ctx) => {
      ctx.reply(
        `Te enviamos la información del tiempo todos los días a las ${userInfo.time}`,
        Markup.inlineKeyboard([
          [Markup.button.callback("Update Time", "UPDATE_TIME")],
        ])
      );
    });

    bot.action("UPDATE_TIME", (ctx, next) => {
      return ctx
        .reply(
          "👍",
          Markup.inlineKeyboard([
            [
              Markup.button.callback("1", "UPDATE_HOUR"),
              Markup.button.callback("2", "UPDATE_HOUR"),
            ],
          ])
        )
        .then(() => next());
    });

    bot.action("UPDATE_HOUR", (ctx, next) => {
      console.log(JSON.stringify(ctx));
    });

    bot.on(message("location"), async (ctx) => {
      const { latitude, longitude } = ctx.message.location;
      ctx.reply(
        `Location received! Latitude: ${latitude}, Longitude: ${longitude}`
      );

      const { data, error } = await getForecast(latitude, longitude);

      if (error) {
        ctx.reply(
          "Se ha producido un error consultando el tiempo. Inténtalo de nuevo más tarde"
        );
        return;
      }

      ctx.reply(formatForecast(data), { parse_mode: "HTML" });
    });

    bot.catch((error) => {
      logError(error as Error);
    });

    bot.launch().catch((err) => {
      logError(err);
    });

    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (e) {
    logError(e);
  }
})();

function logError(e: Error) {
  console.log("======================");
  console.log(e?.stack);
  console.log("======================");
  const errorFile = `./error-bot.txt`;
  fs.appendFileSync(errorFile, "======== \n" + e?.stack);
}
