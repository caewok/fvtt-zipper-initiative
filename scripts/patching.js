/* globals
*/
"use strict";

import { Patcher } from "./Patcher.js";
import { PATCHES as PATCHES_Combat } from "./combat.js";

const PATCHES = { Combat: PATCHES_Combat };
export const PATCHER = new Patcher();

export function registerZipInitiative() {
  PATCHER.addPatchesFromRegistrationObject(PATCHES);
  PATCHER.registerGroup("BASIC");
}

export function registerPopcorn() { PATCHER.registerGroup("POPCORN"); }

export function deregisterPopcorn() { PATCHER.deregisterGroup("BASIC"); }
