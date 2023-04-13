/* globals
game
*/

"use strict";

import { MODULE_ID } from "./const.js";

export const SETTINGS = {
  CHANGELOG: "changelog",
  RESET_EACH_ROUND: "resetEachRound"
};

export function getSetting(settingName) {
  return game.settings.get(MODULE_ID, settingName);
}

export async function toggleSetting(settingName) {
  const curr = getSetting(settingName);
  return await game.settings.set(MODULE_ID, settingName, !curr);
}

export async function setSetting(settingName, value) {
  return await game.settings.set(MODULE_ID, settingName, value);
}

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.RESET_EACH_ROUND, {
    name: game.i18n.localize(`${MODULE_ID}.settings.${SETTINGS.RESET_EACH_ROUND}.Name`),
    hint: game.i18n.localize(`${MODULE_ID}.settings.${SETTINGS.RESET_EACH_ROUND}.Hint`),
    type: Boolean,
    default: false,
    scope: "world",
    config: true
  });
}
