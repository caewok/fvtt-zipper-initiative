/* globals
*/
"use strict";

import { Patcher } from "./Patcher.js";
import { PATCHES as PATCHES_Combat } from "./combat.js";
import { PATCHES as PATCHES_Settings } from "./ModuleSettingsAbstract.js";

const PATCHES = {
  "CONFIG.Combat.documentClass": PATCHES_Combat,
  "foundry.helpers.ClientSettings": PATCHES_Settings,
};
export const PATCHER = new Patcher();

export function registerZipInitiative() {
  PATCHER.addPatchesFromRegistrationObject(PATCHES);
  PATCHER.registerGroup("BASIC");
}

export function registerPopcorn() { PATCHER.registerGroup("POPCORN"); }

export function deregisterPopcorn() { PATCHER.deregisterGroup("BASIC"); }
