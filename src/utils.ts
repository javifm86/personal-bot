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

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function encodeQueryData(data: { [key: string]: string | number }) {
  let ret: string[] = [];

  for (let d in data) {
    ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
  }
  return ret.join("&");
}

export function getIcon(id: number) {
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
