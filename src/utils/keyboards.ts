import { Markup } from "telegraf";

const enum ActionsUpdateKeyboard {
  TIME = "UPDATE_TIME",
  LOCATION = "UPDATE_LOCATION",
}

const INLINE_UPDATE_KEYBOARD = Markup.inlineKeyboard([
  [Markup.button.callback("Actualizar hora", ActionsUpdateKeyboard.TIME)],
  [
    Markup.button.callback(
      "Actualizar localización",
      ActionsUpdateKeyboard.LOCATION
    ),
  ],
]);

const MAIN_KEYBOARD = Markup.keyboard([
  ["Ver mi suscripción"],
  [Markup.button.locationRequest("Consultar tiempo actual")],
]);

const INLINE_HOURS_DAY_KEYBOARD = Markup.inlineKeyboard(
  createHoursDayButtons()
);

const SEND_LOCATION_KEYBOARD = Markup.keyboard([
  Markup.button.locationRequest("Enviar ubicación"),
]);

function createTimeButtons(startHour: number, endHour: number): any[] {
  const buttons = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    // Format the hour to a two-digit string
    const hourString = hour.toString().padStart(2, "0");
    // Create a button with the formatted time and corresponding data
    buttons.push(
      Markup.button.callback(`${hourString}:00`, `data-${hourString}`)
    );
  }
  return buttons;
}

function createHoursDayButtons() {
  return [
    createTimeButtons(0, 5),
    createTimeButtons(6, 11),
    createTimeButtons(12, 17),
    createTimeButtons(18, 23),
  ];
}

export {
  MAIN_KEYBOARD,
  INLINE_HOURS_DAY_KEYBOARD,
  INLINE_UPDATE_KEYBOARD,
  SEND_LOCATION_KEYBOARD,
  ActionsUpdateKeyboard,
};
