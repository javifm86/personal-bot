import { PREDICTION_NUMBER } from "../constants";
import literals from "../literals";
import { List, OpenWeatherResponse } from "../types";

const enum Icons {
  SUN = "\u2600",
  CLOUD = "\u2601",
  RAIN = "\u2614",
  PART_CLOUDY = "\u26C5",
  SNOW = "\u2744",
  HOT_SPRINGS = "\u2668",
  WARNING = "\u26A0",
  RAY = "\u26A1",
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function encodeQueryData(data: { [key: string]: string | number }) {
  let ret: string[] = [];

  for (let d in data) {
    ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
  }
  return ret.join("&");
}

function getIcon(id: number) {
  if (id >= 200 && id < 300) {
    return Icons.RAY;
  }

  if (id >= 300 && id < 400) {
    return Icons.RAIN;
  }

  if (id >= 500 && id < 600) {
    return Icons.RAIN;
  }

  if (id >= 500 && id < 600) {
    return Icons.SNOW;
  }

  if (id >= 600 && id < 700) {
    return Icons.HOT_SPRINGS;
  }

  if (id === 800) {
    return Icons.SUN;
  }

  if (id >= 800 && id < 900) {
    return Icons.CLOUD;
  }
  return Icons.WARNING;
}

function formatForecast(data: OpenWeatherResponse) {
  let msg = "";
  msg = `<b>${literals.weatherPrediction} ${literals.for} ${data.city.name}</b>\n\n`;

  let list = data.list;
  let count = list.length < PREDICTION_NUMBER ? list.length : PREDICTION_NUMBER;

  // Concat weather prediction messages
  for (let i = 0; i < count; i++) {
    msg += sendWeather(list[i]);
  }

  return msg;
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

function formatTime(date: Date) {
  const timeFormatter = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return timeFormatter.format(date);
}

function logError(e: Error) {
  console.error(e?.stack);
  console.log("======================");
}

export { encodeQueryData, formatForecast, logError };
