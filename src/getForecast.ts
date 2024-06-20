import { WEATHER_BASE } from "./constants";
import { encodeQueryData } from "./utils";

function getUrl(lat: number, lon: number) {
  var getParams = {
    appid: process.env.OPENWEATHER_TOKEN as string,
    units: "metric",
    lang: "sp",
    lat,
    lon,
  };

  return WEATHER_BASE + encodeQueryData(getParams);
}

async function getForecast(lat: number, lon: number) {
  const urlWithParams = getUrl(lat, lon);
  const response = await fetch(urlWithParams);

  if (!response.ok) {
    return {
      error: true,
      data: null,
    };
  }

  const data = await response.json();

  return { data, error: false };
}

export default getForecast;
