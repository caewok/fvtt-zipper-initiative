/* globals
*/
"use strict";

export const MODULE_ID = "zipperinitiative";

export const FLAGS = {
  COMBATANT: {
    RANK: "initRank"
  },
  DND5E: {
    DEX_TIEBREAKER: "initiativeDexTiebreaker"
  }
};

export const MODULES_ACTIVE = { API: {} };

// Hook init b/c game.modules is not initialized at start.
Hooks.once("init", function() {
  MODULES_ACTIVE.DSN = game.modules.get("dice-so-nice")?.active;
});
