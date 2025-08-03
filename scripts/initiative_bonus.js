/* globals
CONFIG,
game,
*/
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
"use strict";

/**
 * Determine the initiative bonus for a given token.
 * See https://github.com/foundryvtt/dnd5e/blob/bdc76e271d1ebae7092824c4f0e7c5299d7172e4/module/documents/actor/actor.mjs#L1434
 * @param {Token} token     Token to test
 * @returns {number} Bonus amount
 */
function initBonusDND5e(token) {
  if ( !token.actor ) return Number.NEGATIVE_INFINITY;

  const roll = token.actor.getInitiativeRoll();
  let bonus = 0;

  // Proficiency
  const profBonus = roll.data.prof?.term ?? 0;
  bonus += Number(profBonus);

  // Initiative bonus
  const initBonus = roll.data.bonus ?? 0;
  bonus += Number(initBonus);

  // Ability check bonus
  const abilityBonus = roll.data.abilityBonus ?? 0;
  bonus += Number(abilityBonus);

  // Global bonus
  const globalBonus = roll.data.globalBonus ?? 0;
  bonus += Number(globalBonus);

  // Alert feat
  const alertBonus = roll.data.alertBonus ?? 0;
  bonus += Number(alertBonus);

  // Ability tiebreaker
  const system = token.actor.system;
  const init = system.attributes?.init;
  const abilityId = init?.ability || CONFIG.DND5E.defaultAbilities?.initiative || CONFIG.DND5E.initiativeAbility; // For < dnd5e 3.1
  const tiebreaker = game.settings.get("dnd5e", "initiativeDexTiebreaker");
  if ( tiebreaker && ("abilities" in system) ) {
    const abilityValue = system.abilities[abilityId]?.value;
    if ( Number.isNumeric(abilityValue) ) bonus += abilityValue;
  }

  // TODO: Halfling luck?

  // Estimate advantage to be worth 4 points on average.
  // TODO: Make this a CONFIG or otherwise more precise?
  if ( roll.hasAdvantage ) bonus += 4;
  if ( roll.hasDisadvantage ) bonus -= 4;

  return bonus;
}

/**
 * Determine the initiative bonus for a given token.
 * See https://github.com/foundryvtt/dnd5e/blob/bdc76e271d1ebae7092824c4f0e7c5299d7172e4/module/documents/actor/actor.mjs#L1434
 * @param {Token} token     Token to test
 * @returns {number} Bonus amount
 */
function initBonusPF2e(token) {
  return token.actor?.initiative?.statistic?.check?.mod ?? Number.NEGATIVE_INFINITY;
}


export const INITIATIVE_BONUS_FUNCTIONS = {
  dnd5e: initBonusDND5e,
  pf2e: initBonusPF2e,
};
