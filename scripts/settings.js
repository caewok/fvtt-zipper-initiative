/* globals
game
*/

"use strict";

import { ModuleSettingsAbstract } from "./ModuleSettingsAbstract.js";
import { registerPopcorn, deregisterPopcorn } from "./patching.js";

const SETTINGS = {
  CHANGELOG: "changelog",
  RESET_EACH_ROUND: "resetEachRound",
  NPC_LEADER_HIGHEST_INIT: "npcLeaderHighestInitiative",
  INTERLEAVE_NPCS: "npcInterleave",
  USE_DSN: "useDSN", // Dice So Nice rolls
  POPCORN: {
    NPC: "popcornNPC",
    PC: "popcornPC"
  }
};

export class Settings extends ModuleSettingsAbstract {
  /** @type {object} */
  static KEYS = SETTINGS;

  static registerAll() {
    const { KEYS, register, localize } = this;

    register(KEYS.RESET_EACH_ROUND, {
      name: localize(`${KEYS.RESET_EACH_ROUND}.Name`),
      hint: localize(`${KEYS.RESET_EACH_ROUND}.Hint`),
      type: Boolean,
      default: false,
      scope: "world",
      config: true
    });

    register(KEYS.NPC_LEADER_HIGHEST_INIT, {
      name: localize(`${KEYS.NPC_LEADER_HIGHEST_INIT}.Name`),
      hint: localize(`${KEYS.NPC_LEADER_HIGHEST_INIT}.Hint`),
      type: Boolean,
      default: false,
      scope: "world",
      config: true
    });

    register(KEYS.USE_DSN, {
      name: localize(`${KEYS.USE_DSN}.Name`),
      hint: localize(`${KEYS.USE_DSN}.Hint`),
      type: Boolean,
      default: true,
      scope: "world",
      config: true
    });

    register(KEYS.INTERLEAVE_NPCS, {
      name: localize(`${KEYS.INTERLEAVE_NPCS}.Name`),
      hint: localize(`${KEYS.INTERLEAVE_NPCS}.Hint`),
      type: Boolean,
      default: false,
      scope: "world",
      config: true
    });

    register(KEYS.POPCORN.PC, {
      name: localize(`${KEYS.POPCORN.PC}.Name`),
      hint: localize(`${KEYS.POPCORN.PC}.Hint`),
      type: Boolean,
      default: false,
      scope: "world",
      config: true,
      onChange: value => {
        if ( value ) registerPopcorn();
        else if ( !this.get(KEYS.POPCORN.NPC) ) deregisterPopcorn();
      }
    });

    register(KEYS.POPCORN.NPC, {
      name: localize(`${KEYS.POPCORN.NPC}.Name`),
      hint: localize(`${KEYS.POPCORN.NPC}.Hint`),
      type: Boolean,
      default: false,
      scope: "world",
      config: true,
      onChange: value => {
        if ( value ) registerPopcorn();
        else if ( !this.get(KEYS.POPCORN.PC) ) deregisterPopcorn();
      }
    });

    // Set up the hook to use popcorn.
    if ( this.get(KEYS.POPCORN.PC) || this.get(KEYS.POPCORN.NPC) ) registerPopcorn();
  }
}
