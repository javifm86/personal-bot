import dotenv from "dotenv";
import fs from "fs";

import { Telegraf, Markup } from "telegraf";
import { List } from "./types";
import literals from "./literals";
import { capitalizeFirstLetter, encodeQueryData, getIcon } from "./utils";
import { PREDICTION_NUMBER, WEATHER_BASE } from "./constants";

dotenv.config();

/**
 *  Return OpenWeatherMap url for weather petition.
 *
 *  @param  {Object} params : Object with lat and lon properties according to user location.
 */

const getUrl = function (params: { [key: string]: string | number }) {
  var getParams = {
    appid: process.env.OPENWEATHER_TOKEN as string,
    units: "metric",
    lang: "sp",
    lat: params.lat,
    lon: params.lon,
  };

  return WEATHER_BASE + encodeQueryData(getParams);
};

const msg = {
  ficharSalida: "fichar de salida",
  ficharSalida7h15m: "fichar de salida 7h 15m",
  ficharSalida7h30m: "fichar de salida 7h 30m",
  check: "comprobar bot activo",
};

const MAIN_KEYBOARD = [
  [{ text: msg.ficharSalida7h15m, callback_data: "ficharSalida7h15m" }],
  [{ text: msg.ficharSalida7h30m, callback_data: "ficharSalida7h30m" }],
  [{ text: msg.ficharSalida, callback_data: "ficharSalida" }],
  [{ text: msg.check, callback_data: "check" }],
];

(async () => {
  // const timeoutMs = calculateMsForTimeout(process.env.TIME_TO_LAUNCH as string);
  try {
    console.log("Token:", process.env.BOT_TOKEN);
    const bot = new Telegraf(process.env.BOT_TOKEN as string);
    console.log("Bot iniciado");

    bot.start((ctx) => {
      // const chatId = ctx.chat.id;

      // if (!isJaviOrGuille(chatId)) {
      //   return;
      // }

      ctx.reply(
        "Hola sr Javier estoy aquí para facilitarte la vida",
        Markup.inlineKeyboard(MAIN_KEYBOARD)
      );
    });

    bot.action("check", async (ctx) => {
      // const chatId = ctx.chat?.id;

      // if (!chatId || !isJaviOrGuille(chatId)) {
      //   return;
      // }

      // if (!isJaviOrGuille(chatId)) {
      //   return;
      // }

      fetch(
        `http://api.openweathermap.org/data/2.5/forecast?appid=${process.env.OPENWEATHER_TOKEN}&units=metric&lang=sp&lat=40.489852&lon=-3.689193`
      )
        .then((response) => response.json())
        .then(async (data) => {
          let msg = "";
          msg = `<b>${literals.weatherPrediction} ${literals.for} ${data.city.name}</b>\n\n`;

          let list = data.list;
          let count;

          if (list.length < PREDICTION_NUMBER) {
            count = list.length;
          } else {
            count = PREDICTION_NUMBER;
          }

          // Concat weather prediction messages
          for (let i = 0; i < count; i++) {
            msg += sendWeather(list[i]);
          }
          console.log(msg);
          await ctx.reply(msg, { parse_mode: "HTML" });
        })
        .catch(function (err) {
          console.log("Unable to fetch -", err);
        });

      await ctx.reply("Bot en funcionamiento, ¡todo en orden!");
      await ctx.reply(
        "¿Qué deseas hacer ahora?",
        Markup.inlineKeyboard(MAIN_KEYBOARD)
      );
      ctx.answerCbQuery();
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

function formatTime(date: Date) {
  const timeFormatter = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return timeFormatter.format(date);
}

function sendWeather(weatherAlert: List) {
  let time = new Date(weatherAlert.dt * 1000);
  let timeFormated = formatTime(time);
  let weatherId = weatherAlert.weather[0].id;
  let description = capitalizeFirstLetter(weatherAlert.weather[0].description);
  let minTemperature = Math.round(weatherAlert.main.temp_min);
  let maxTemperature = Math.round(weatherAlert.main.temp_max);
  let msg = "";

  // Weather description with icon
  msg += `${timeFormated}: <b>${description}</b> ${getIcon(weatherId)}\n`;

  // Min and max temperature are different
  if (minTemperature !== maxTemperature) {
    msg += `${literals.temperature}: ${Math.round(
      weatherAlert.main.temp_min
    )}°C - `;
    msg += `${Math.round(weatherAlert.main.temp_max)}°C\n`;
  }

  // No sense showing the same info
  else {
    msg += `${literals.temperature}: ${Math.round(
      weatherAlert.main.temp_max
    )}°C\n`;
  }

  // Rain
  if (weatherAlert.rain && weatherAlert.rain["3h"] != null) {
    msg += `${literals.rain}: ${weatherAlert.rain["3h"]}mm\n`;
  }

  // Snow
  if (weatherAlert.snow && weatherAlert.snow["3h"] != null) {
    msg += `${literals.snow}: ${weatherAlert.snow["3h"]}\n`;
  }

  msg += "\n";

  return msg;
}

function isJaviOrGuille(chatId: number) {
  const isJavi = chatId === 379912789;
  const isGuille = chatId === 6046994986;

  return isGuille || isJavi;
}

function logError(e: Error) {
  console.log("======================");
  console.log(e?.stack);
  console.log("======================");
  const errorFile = `./error-bot.txt`;
  fs.appendFileSync(errorFile, "======== \n" + e?.stack);
}
