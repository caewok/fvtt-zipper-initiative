/* globals
CONFIG,
game,
Hooks,
*/
"use strict";

// Basics
import { MODULE_ID } from "./const.js";
import { log } from "./util.js";

// Patching
import { registerZipInitiative, PATCHER } from "./patching.js";

// Settings
import { Settings } from "./settings.js";

// System-specific
import { INITIATIVE_BONUS_FUNCTIONS } from "./initiative_bonus.js";

// Self-executing scripts for hooks
import "./changelog.js";

import { TimedDialog, selectCombatant } from "./popcorn.js";

/**
 * Tell DevMode that we want a flag for debugging this module.
 * https://github.com/League-of-Foundry-Developers/foundryvtt-devMode
 */
Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(MODULE_ID);
});

Hooks.once("init", () => {
  log("Initializing...");
  registerZipInitiative();

  game.modules.get(MODULE_ID).api = {
    TimedDialog,
    selectCombatant,
    PATCHER
  };

  // Set configuration values used internally
  CONFIG[MODULE_ID] = {
    /**
     * Maximum number of seconds to wait before timing out of the rollNPCs due to
     * players not yet rolling. If this value is 0 or less, it will never time out.
     * @type {number}
     */
    maxSeconds: 15,

    /**
     * Maximum number of seconds to wait before timing out the popcorn dialog.
     * @type {number}
     */
    popcornTimeout: 30,

    /**
     * Function to get the initiative bonus of a token.
     * @param {Token} token     Token to test
     * @returns {number} Bonus amount
     */
    initiativeBonus: INITIATIVE_BONUS_FUNCTIONS[game.system.id] ?? (token => Number.NEGATIVE_INFINITY),
  };
});

Hooks.once("setup", () => {
  Settings.registerAll();
});

/* Combat Tracker Hooks

Add Combat:
- preCreateCombat
- createCombat
- getCombatTracker5eEntryContext
- getCombatTrackerEntryContext
- renderCombatTracker5e
- renderCombatTracker
- preUpdateCombat
- updateCombat
- getCombatTracker5eEntryContext
- getCombatTrackerEntryContext
- renderCombatTracker5e
- renderCombatTracker

Click Combat Tracker settings:
- getCombatTrackerConfigHeaderButtons
- renderCombatTrackerConfig

Close Combat Tracker settings:
- closeCombatTrackerConfig

Add 3 combatants to tracker:
- preCreateCombatant (x3)
- createCombatant (x3)
- getCombatTracker5eEntryContext
- getCombatTrackerEntryContext
- renderCombatTracker5e
- renderCombatTracker

Roll initiative button:
- renderApplication
** Initiative Roll dialog pops up **
- dnd5e.preRollInitiative
- preUpdateCombatant
- updateCombatant
- getCombatTracker5eEntryContext
- getCombatTrackerEntryContext
- renderCombatTracker5e
- renderCombatTracker
- dnd5e.rollInitiative

Roll NPCs:
- preUpdateCombatant
- updateCombatant
- getCombatTracker5eEntryContext
- getCombatTrackerEntryContext
- renderCombatTracker5e
- renderCombatTracker

Roll all:
- preUpdateCombatant
- updateCombatant
- preCreateChatMessage
- getCombatTracker5eEntryContext
- getCombatTrackerEntryContext
- renderCombatTracker5e
- renderCombatTracker

Reset initiative:
- preUpdateCombat
- updateCombat
- getCombatTracker5eEntryContext
- getCombatTrackerEntryContext
- renderCombatTracker5e
- renderCombatTracker

Begin Combat:
- combatStart
- preUpdateCombat
- updateCombat
- getCombatTracker5eEntryContext
- getCombatTrackerEntryContext
- renderCombatTracker5e
- renderCombatTracker

(Note: Begin Combat does not cause tokens to roll initiative if not yet set)

*/
