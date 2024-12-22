/* globals
FormDataExtended,
foundry,
game,
ui
*/
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
"use strict";

import { MODULE_ID, FLAGS } from "./const.js";
import { getSetting, SETTINGS } from "./settings.js";

/*
Functions to handle popcorn initiative.
When enabled for PCs, when a PC turn ends and 2+ PCs remain in the initiative,
a dialog asks the PC whose turn ended to select another.
When enabled for NPCs, when an NPC turn ends and 1+ PCs remain in the initiative,
a dialog asks the GM to select the next NPC.

In both cases the combatant selected swaps places with the next in the init order.
*/

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay)); // eslint-disable-line no-promise-executor-return

export class TimedDialog extends foundry.applications.api.DialogV2 {

  static async wait({ rejectClose=false, close, render, ...options }={}) {
    return super.wait({ rejectClose, close, render, ...options });
  }

  _initializeApplicationOptions(options) {
    options.content += '<i><p class="dialog_timer"></p></i>';
    return super._initializeApplicationOptions(options);
  }

  _onFirstRender(_context, _options) {
    const timeoutSeconds = this.options.timeoutSeconds ?? 30;
    super._onFirstRender(_context, _options);
    console.log({_context, _options, dialog: this });
    const timingFn = async _ => {
      for ( let i = timeoutSeconds; i > 0; i -= 1 ) {
        await sleep(1000);
        try {
          this.element.getElementsByClassName("dialog_timer")[0].innerHTML = `You have ${i} seconds remaining to decide...`;
        } catch(_error) { // eslint-disable-line no-unused-vars
          break;
          // console.error(error);
        }
      }
      this.close();
    };
    timingFn();
  }

  async _preClose(options) {
    const handler = this.options.form.handler;
    if ( handler instanceof Function ) {
      const form = this.element.getElementsByTagName("form")[0];
      const formData = new FormDataExtended(form);
      try {
        await handler.call(this, form, formData);
      } catch(err) {
        ui.notifications.error(err, {console: true});
      }
    }
    return super._preClose(options);
  }
}


/**
 * Presents dialog to select combatant from list of combatants.
 * @param {string[]} combatantIds      Array of combatant ids.
 * @param {string} defaultCombatantId   The combatant that is selected by default.
 * @param {object} opts
 * @param {string} [groupName="PCs"]    The name of the combatant group being chosen
 * @param {number} [timeout=30]         Number of seconds the dialog should remain.
 * @returns {string} The selected combatant id
 */
export async function selectCombatant(combatantIds, defaultCombatantId, { groupName = "PC", timeoutSeconds = 30 } = {}) {
  combatantIds ??= [...game.combat.combatants.keys()];
  if ( combatantIds.length === 0 ) return null;
  defaultCombatantId ??= combatantIds[0];
  if ( combatantIds.length === 1 ) return defaultCombatantId;

  // Set up the combatant choices.
  let radioSelections = '<div class="flex-container" style="display:flex; flex-flow:column wrap">';
  for ( const combatantId of combatantIds ) {
    const c = game.combat.combatants.get(combatantId);
    if ( !c ) continue;
    const tokenD = c.token;
    const isChecked = combatantId === defaultCombatantId;
    // See Handlebars.radioBoxes
    const selection = `
      <div style="min-height:40px">
        <label class="checkbox" >
          <input type="radio" name="${MODULE_ID}_combatant_choice" value="${combatantId}" ${isChecked ? "checked" : ""}>
          &nbsp<img src="${tokenD.texture.src}" width="36" height="36" border="0">&nbsp${tokenD.name}&nbsp&nbsp&nbsp
        </label>
      </div>
    `;

    radioSelections += selection;
  }
  // style="font-size:14pt;line-height:200%;"
  radioSelections += "</div>";

  const options = {};
  options.buttons = [{
    action: "ok",
    label: "Confirm",
    icon: "fas fa-check",
    default: true
  }];
  options.window = { title: "Choose next combatant", resizable: true };
  options.content = `
    <p>Select a ${groupName} to be the next ${groupName} in the initiative order:</p>
    <div>${radioSelections}</div>
  `;
  options.timeoutSeconds = timeoutSeconds;

  let result = defaultCombatantId;
  options.form = {
    handler: (form, formData) => result = formData.object[`${MODULE_ID}_combatant_choice`]
  };

  await TimedDialog.prompt(options);
  return result;
}

/**
 * Should we ask the PC for a swap?
 * @returns {bool}
 */
export function needPopcornPC() {
  if ( !getSetting(SETTINGS.POPCORN.PC) ) return false;
  const currCombatant = game.combat.combatant;
  if ( currCombatant.isNPC ) return false;
  if ( remainingPCs().length < 2 ) return false;
  return true;
}

/**
 * Should we ask the GM for a swap?
 * @returns {bool}
 */
export function needPopcornNPC() {
  if ( !getSetting(SETTINGS.POPCORN.NPC) ) return false;
  const currCombatant = game.combat.combatant;
  if ( !currCombatant.isNPC ) return false;
  if ( remainingPCs().length < 1 ) return false;
  return true;
}

/**
 * For the current combat, return the remaining PC combatants not including current.
 * @returns {Combatant[]}
 */
function remainingPCs() {
  const currCombatant = game.combat.combatant;
  const initRank = currCombatant.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK);
  return [...game.combat.combatants.values()].filter(c => !c.isNPC
    && c.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK) > initRank);
}

/* Testing
tmp = [...game.combat.combatants.values()].map(c => {
  return { name: c.name, isNPC: c.isNPC, rank: c.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK) }
})
tmp.sort((a, b) => a.rank - b.rank)
console.table(tmp)

tmp = remainingCombatants.map(c => {
  return { name: c.name, isNPC: c.isNPC, rank: c.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK) }
})
tmp.sort((a, b) => a.rank - b.rank)
console.table(tmp)

*/

/**
 * For the current combat, return the remaining PC combatants not including current.
 * @returns {Combatant[]}
 */
function remainingNPCs() {
  const currCombatant = game.combat.combatant;
  const initRank = currCombatant.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK);
  return [...game.combat.combatants.values()].filter(c => c.isNPC
    && c.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK) > initRank);
}

/**
 * Handle PC popcorn swap.
 */
export async function handlePopcornPC(updateData, updateOptions) {
  await _handlePopcorn(remainingPCs(), "PC");
  await game.combat.update(updateData, updateOptions);
}

/**
 * Handle NPC popcorn swap.
 */
export async function handlePopcornNPC(updateData, updateOptions) {
  await _handlePopcorn(remainingNPCs(), "NPC");
  await game.combat.update(updateData, updateOptions);
}

/**
 * Utility to handle both PC and NPC popcorn swaps.
 * @param {Combatants} remainingCombatants
 * @param {string}
 */
async function _handlePopcorn(remainingCombatants, groupName = "PC") {
  if ( remainingCombatants < 2 ) return;
  remainingCombatants.sort((a, b) => a.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK) - b.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK));
  const nextC = remainingCombatants[0];
  const selectedCombatantId = await selectCombatant(remainingCombatants.map(c => c.id), undefined, { groupName, });
  if ( selectedCombatantId === nextC.id ) return;

  // Swap the initiatives.
  const chosenC = game.combat.combatants.get(selectedCombatantId);
  const chosenRank = chosenC.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK);
  const nextRank = nextC.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK);
  const updates = [
    { _id: nextC.id, initiative: chosenC.initiative, flags: { [MODULE_ID]: { [FLAGS.COMBATANT.RANK]: chosenRank } } },
    { _id: chosenC.id, initiative: nextC.initiative, flags: { [MODULE_ID]: { [FLAGS.COMBATANT.RANK]: nextRank } } }
  ];
  await game.combat.updateEmbeddedDocuments("Combatant", updates);
}


/* Testing
MODULE_ID = "zipperinitiative"
api = game.modules.get(MODULE_ID).api
TimedDialog = api.TimedDialog
selectCombatant = api.selectCombatant

combatants = game.combat.combatants;
combatantIds = [...game.combat.combatants.keys()];
defaultCombatantId = [...game.combat.combatants.keys()][0]

res = await selectCombatant(combatantIds)
*/
