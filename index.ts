import dotenv from "dotenv";
import fs from "fs";

import { Telegraf, Markup } from "telegraf";
import { List } from "./types";

dotenv.config();

const PREDICTION_NUMBER = 10;

const utils = {
  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  padLeft(str: string, fillTo: number, padChar: string = "0") {
    var pad = new Array(1 + fillTo).join(padChar);
    return (pad + str).slice(-pad.length);
  },

  encodeQueryData(data: { [key: string]: string | number }) {
    let ret = [];
    for (let d in data) {
      ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    }
    return ret.join("&");
  },
};

const str = {
  /**
   *  Replace params in string.
   *
   *  @param  {String} str           : String where replace.
   *  @param  {Array}  paramsReplace : Array of objects.
   *                                   [{
   *                                       key  : Name of the param in the template.
   *                                       value: Value for the param to be inserted.
   *                                   }]
   */

  insert(str: string, paramsReplace: { key: string; value: string }[]) {
    let finalStr;
    let objParam;

    for (let i = 0, len = paramsReplace.length; i < len; i++) {
      objParam = paramsReplace[i];
      finalStr = str.replace("{{" + objParam.key + "}}", objParam.value);
    }

    return finalStr;
  },

  // Strings
  subscribe: "Suscribirme a actualizaciones del tiempo",
  subscriptionHour: "¿A qué hora quieres recibir la alerta? (0-23)",
  subscriptionHourError: "La hora introducida es incorrecta. (0-23)",
  subscriptionMinute: "¿En qué minuto? (0-59)",
  subscriptionMinuteError: "Los minutos introducidos son incorrectos. (0-59)",
  subscriptionLocation: "Necesitamos tu ubicación para enviarte el tiempo.",
  requestLocation:
    "Por favor, envíame la ubicación de dónde deseas la previsión metereológica.\n\nPulsa el botón <b>Enviar Localización</b> si deseas desde tu posición actual, o enviame otra ubicación a través del icono del clip de Telegram.",
  sendLocation: "Enviar localización",
  state: "Ver mi suscripción",
  unsubscribe: "Eliminar suscripción",
  current: "Consultar tiempo actual",
  welcome:
    "¡Hola {{name}}! Bienvenid@ al bot encargado del servicio del tiempo. ¿Qué te gustaría hacer?",
  showSubscription: "te enviamos la información del tiempo todos los días",
  at: "a las",
  weatherPrediction: "Previsión del tiempo",
  temperature: "Temperatura",
  subscriptionCompleted:
    "Tu suscripción a las alertas del tiempo se ha completado. ¿Qué deseas hacer?",
  subscriptionRemoved:
    "Tu suscripción a las alertas del tiempo ha sido eliminada. ¿Qué deseas hacer?",
  rain: "Lluvia",
  for: "para",
  snow: "Nieve",
};

const config = {
  TELEGRAM_BOT_TOKEN: "PUT_YOUR_TELEGRAM_BOT_TOKEN",
  OPENWEATHER_TOKEN: "PUT_YOUR_OPENWEATHER_TOKEN",
  SQLITE_DB_PATH: "/path/to/your/db/file/users",
  REQUIRED_PARAMS: 4,
  PREDICTION_NUMBER: 6,
  ICONS: {
    SUN: "\u2600",
    CLOUD: "\u2601",
    RAIN: "\u2614",
    PART_CLOUDY: "\u26C5",
    SNOW: "\u2744",
    HOT_SPRINGS: "\u2668",
    WARNING: "\u26A0",
    RAY: "\u26A1",
  },
  KEYBOARD: {
    HOURS: {
      keyboard: [
        ["0", "1", "2", "3", "4", "5"],
        ["6", "7", "8", "9", "10", "11"],
        ["12", "13", "14", "15", "16", "17"],
        ["18", "19", "20", "21", "22", "23"],
      ],
      resize_keyboard: true,
    },

    MINUTES: {
      keyboard: [
        ["00", "10", "20"],
        ["30", "40", "50"],
      ],
      resize_keyboard: true,
    },

    LOCATION: {
      keyboard: [
        [
          {
            text: str.sendLocation,
            request_location: true,
          },
        ],
      ],
      resize_keyboard: true,
    },
  },
  RETRY: 300000, // 5 minutes
};

/**
 *  Return icon weather depending on code returned by OpenWeatherMap.
 *
 *  @param  {Number} id : Id for type of weather.
 */

const getIcon = function (id: number) {
  if (id >= 200 && id < 300) {
    return config.ICONS.RAY;
  } else if (id >= 300 && id < 400) {
    return config.ICONS.RAIN;
  } else if (id >= 500 && id < 600) {
    return config.ICONS.RAIN;
  } else if (id >= 500 && id < 600) {
    return config.ICONS.SNOW;
  } else if (id >= 600 && id < 700) {
    return config.ICONS.HOT_SPRINGS;
  } else if (id === 800) {
    return config.ICONS.SUN;
  } else if (id >= 800 && id < 900) {
    return config.ICONS.CLOUD;
  } else {
    return config.ICONS.WARNING;
  }
};

// OpenWeatherMap API params
const WEATHER_BASE = "http://api.openweathermap.org/data/2.5/forecast?";
const TOKEN_WEATHER = config.OPENWEATHER_TOKEN;

/**
 *  Return OpenWeatherMap url for weather petition.
 *
 *  @param  {Object} params : Object with lat and lon properties according to user location.
 */

const getUrl = function (params: { [key: string]: string | number }) {
  var getParams = {
    appid: TOKEN_WEATHER,
    units: "metric",
    lang: "sp",
    lat: params.lat,
    lon: params.lon,
  };

  return WEATHER_BASE + utils.encodeQueryData(getParams);
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
          msg = `<b>${str.weatherPrediction} ${str.for} ${data.city.name}</b>\n\n`;

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
  let description = utils.capitalizeFirstLetter(
    weatherAlert.weather[0].description
  );
  let minTemperature = Math.round(weatherAlert.main.temp_min);
  let maxTemperature = Math.round(weatherAlert.main.temp_max);
  let msg = "";

  // Weather description with icon
  msg += `${timeFormated}: <b>${description}</b> ${getIcon(weatherId)}\n`;

  // Min and max temperature are different
  if (minTemperature !== maxTemperature) {
    msg += `${str.temperature}: ${Math.round(weatherAlert.main.temp_min)}°C - `;
    msg += `${Math.round(weatherAlert.main.temp_max)}°C\n`;
  }

  // No sense showing the same info
  else {
    msg += `${str.temperature}: ${Math.round(weatherAlert.main.temp_max)}°C\n`;
  }

  // Rain
  if (weatherAlert.rain && weatherAlert.rain["3h"] != null) {
    msg += `${str.rain}: ${weatherAlert.rain["3h"]}mm\n`;
  }

  // Snow
  if (weatherAlert.snow && weatherAlert.snow["3h"] != null) {
    msg += `${str.snow}: ${weatherAlert.snow["3h"]}\n`;
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
