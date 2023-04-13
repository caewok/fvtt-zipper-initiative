/* globals
Hooks,
*/
"use strict";

// Basics
import { MODULE_ID } from "./const.js";
import { log } from "./util.js";

// Patching
import { registerZipInitiative } from "./patching.js";

// Settings
import { registerSettings } from "./settings.js";

// Self-executing scripts for hooks
import "./changelog.js";

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

  // Set configuration values used internally
  CONFIG[MODULE_ID] = {
    /**
     * Maximum number of seconds to wait before timing out of the rollNPCs due to
     * players not yet rolling. If this value is 0 or less, it will never time out.
     * @type {number}
     */
    maxSeconds: 15
  }

});

Hooks.once("setup", () => {
  registerSettings();
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