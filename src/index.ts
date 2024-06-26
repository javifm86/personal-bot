import dotenv from "dotenv";
import fs from "fs";

import { Telegraf, Markup, Context, session } from "telegraf";
import { message } from "telegraf/filters";
import { createHoursDayButtons, formatForecast } from "./utils";
import { getUserInfo, updateUserInfo } from "./userInfo";
import getForecast from "./getForecast";

interface MySession {
  locationRequestSource?: string;
}

interface MyContext extends Context {
  session: MySession;
}

dotenv.config();

const MAIN_KEYBOARD = Markup.keyboard([
  ["Ver mi suscripción"],
  [Markup.button.locationRequest("Consultar tiempo actual")],
]);

(async () => {
  try {
    const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN as string);
    console.log("Bot iniciado");

    bot.use(session());

    // Middleware to check chat ID
    bot.use((ctx, next) => {
      if (ctx.chat?.id.toString() === process.env.ALLOWED_CHAT_ID) {
        return next();
      }
    });

    bot.start((ctx) => {
      if (!ctx.session) ctx.session = {};

      ctx.reply(
        "¡Hola Javi! Bienvenido al bot encargado del servicio del tiempo. ¿Qué te gustaría hacer?",
        MAIN_KEYBOARD
      );
    });

    bot.hears("Ver mi suscripción", async (ctx) => {
      const userInfo = getUserInfo();

      await ctx.replyWithLocation(userInfo.lat, userInfo.lon);
      await ctx.reply(
        `Te enviamos la información del tiempo todos los días a las ${userInfo.time}`,
        Markup.inlineKeyboard([
          [Markup.button.callback("Actualizar hora", "UPDATE_TIME")],
          [
            Markup.button.callback(
              "Actualizar localización",
              "UPDATE_LOCATION"
            ),
          ],
        ])
      );
    });

    bot.action(/^data-(\d+)$/, async (ctx) => {
      const newTime = `${ctx.match[1]}:00`;
      updateUserInfo({ time: newTime });
      await ctx.answerCbQuery();
      await ctx.reply(`Hora actualizada a las ${newTime}`);
    });

    bot.action("UPDATE_LOCATION", async (ctx, next) => {
      ctx.session.locationRequestSource = "update";
      await ctx.answerCbQuery();
      await ctx.reply(
        "Por favor, envía tu ubicación actual",
        Markup.keyboard([Markup.button.locationRequest("Enviar ubicación")])
          .oneTime()
          .resize()
      );
      next();
    });

    bot.action("UPDATE_TIME", async (ctx, next) => {
      await ctx.answerCbQuery();
      await ctx.reply(
        "Selecciona la nueva hora",
        Markup.inlineKeyboard(createHoursDayButtons())
      );
      next();
    });

    bot.on(message("location"), async (ctx) => {
      const { latitude, longitude } = ctx.message.location;

      // Update location
      if (ctx.session.locationRequestSource === "update") {
        updateUserInfo({ lat: latitude, lon: longitude });
        ctx.session.locationRequestSource = undefined;
        await ctx.reply(
          "La localización se ha actualizado correctamente",
          MAIN_KEYBOARD
        );
        return;
      }

      // Get forecast
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
