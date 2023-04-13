/* globals
CONFIG,
game,
ui,
Hooks
*/
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
"use strict";

import { MODULE_ID, FLAGS } from "./const.js";

/* Roll NPCs:
- Roll the highest NPC if not already
- Intersperse the other NPCs between players by assigning initiative accordingly
- Can we await the results of player rolls at this point?
- NPCs that have manually rolled keep their initiative position
*/

/* Roll all:
- Roll PCs
- See Roll NPCs for rest
*/

/* Flags
To facilitate sorting without resorting to decimals to break initiative ties, use a flag
to rank combatants.
*/

async function resetInitRank(combatant) {
  return combatant.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, Number.NEGATIVE_INFINITY);
}

/**
 * Hook createCombatant.
 */
Hooks.on("createCombatant", createCombatantHook);

async function createCombatantHook(combatant, _options, _id) {
  await resetInitRank(combatant);
}

/**
 * Hook updateCombat.
 */
Hooks.on("updateCombat", updateCombatHook);
async function updateCombatHook(combat, _change, _opts, _id) {
  combat.combatants.forEach(c => {
    if ( c.initiative === null ) resetInitRank(c); // TO-DO: Do we need to await this function?
  });
}

/**
 * Hook nextRound
 */

/**
 * Wrap async Combat.prototype.rollAll
 * @param {object} [options]  Passed to rollInitiative. formula, updateTurn, messageOptions
 */
export async function rollAllCombat(options={}) {
  const combatants = this.combatants.filter(c => c.isOwner);
  if ( !combatants.length ) return;

  // Tracking data for which PCs and NPCs have rolled/not yet rolled.
  const PC = {};
  const NPC = {};
  PC.unrolled = combatants.filter(c => !c.isNPC && c.initiative === null);
  NPC.unrolled = combatants.filter(c => c.isNPC && c.initiative === null);

  // Store initiative updates needed for NPCs.
  const updates = [];

  // Roll remaining PCs.
  if ( PC.unrolled.length ) await this.rollInitiative(PC.unrolled.map(c => c.id), options);

  // If no NPCs left to roll, return.
  if ( !NPC.unrolled.length ) {
    // Ensure the turn order remains with the same combatant
    if ( options.updateTurn && this.combatant?.id ) {
      await this.update({turn: this.turns.findIndex(t => t.id === this.combatant.id)});
    }
    return this;
  }

  // PC rolled should be every PC at this point!
  PC.rolled = combatants.filter(c => !c.isNPC && c.initiative !== null);
  NPC.rolled = combatants.filter(c => c.isNPC && c.initiative !== null);

  // Dnd5e: might require decimal increments
  const useDecimals = game.system.id === "dnd5e" && game.settings.get("dnd5e", FLAGS.DND5E.DEX_TIEBREAKER);
  const initMod = useDecimals ? 0.01 : 1;

  // Determine the leader NPC.
  // Select the candidate with the highest bonus; random otherwise.
  const candidates = NPC.rolled.length ? NPC.rolled : NPC.unrolled;
  const leaderNPC = candidates.reduce((maxNPC, c) => {
    const bonus = initBonus(c.token);
    if ( bonus > maxNPC.initBonus ) {
      maxNPC.initBonus = bonus;
      maxNPC.combatant = c;
    }
    return maxNPC;
  }, { initBonus: Number.NEGATIVE_INFINITY, combatant: null });

  // Fall back on random selection
  if ( !leaderNPC.combatant ) leaderNPC.combatant = candidates[Math.floor(Math.random() * candidates.length)];

  // Remove leader from the unrolled array
  const index = NPC.unrolled.indexOf(leaderNPC.combatant);
  if ( ~index ) NPC.unrolled.splice(index, 1);

  // Sort PCs by initiative
  PC.rolled.sort((a, b) => b.initiative - a.initiative);

  // Determine leaderNPC initiative
  const bestPCInit = PC.rolled[0]?.initiative ?? Number.NEGATIVE_INFINITY;
  const PCsWon = bestPCInit > leaderNPC.combatant.initiative;
//   const leaderInit = PCsWon ? bestPCInit : bestPCInit + 1;
//   updates.push({ _id: leaderNPC.combatant.id, initiative: leaderInit});

  // Roll NPC initiative (silently) and sort by that initiative
  for ( const npc of NPC.unrolled ) {
    const roll = npc.getInitiativeRoll();
    await roll.evaluate({async: true});
    npc._zipInit = roll.total;
  }
  NPC.unrolled.sort((a, b) => b._zipInit - a._zipInit);
  NPC.unrolled.unshift(leaderNPC.combatant)

  // Zip sort remaining unrolled NPCs into PC list
  // PCs won: PC[0] = 0, NPC[0] = 1, PC[1] = 2, NPC[1] = 3...
  // PCs lost: NPC[0] = 0, PC[0] = 1, NPC[1] = 2, PC[1] = 3...
  const numPCs = PC.rolled.length;
  const numNPCs = NPC.unrolled.length;
  if ( PCsWon ) await PC.rolled[0].setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, 0);
  let j = 0;
  let rank = Number(PCsWon);
  for ( let i = Number(PCsWon); i < numPCs && j < numNPCs; i += 1, j += 1, rank += 2 ) {
    const currPC = PC.rolled[i];
    const currNPC = NPC.unrolled[j];
    const PCinit = currPC.initiative;
    const NPCinit = PCinit + initMod;
    const PCrank = rank + 1;
    const NPCrank = rank;
    updates.push({ _id: currNPC.id, initiative: NPCinit });
    await currNPC.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, NPCrank);
    await currPC.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, PCrank);
  }

  // Remainder of NPCs go at the bottom, randomly.
  // To make things interesting, roll their initiatives.
  const remainingNPCs = NPC.unrolled.slice(j);
  if ( remainingNPCs.length ) {
    // Shift the remainders' init rolls down to be below the minimum PC
    const maxRemainingInit = Math.max.apply(null, remainingNPCs.map(c => c._zipInit));
    const targetInit = NPC.unrolled[j].initiative - 1;
    const shift = maxRemainingInit - targetInit;
    remainingNPCs.forEach(c => updates.push({ _id: c.id, initiative: c._zipInit - shift }));
  }

  // Update NPC initiatives
  await this.updateEmbeddedDocuments("Combatant", updates);

  // Ensure the turn order remains with the same combatant
  if ( options.updateTurn && this.combatant?.id ) {
    await this.update({turn: this.turns.findIndex(t => t.id === this.combatant.id)});
  }

  return this;
}

/**
 * Wrap async Combat.prototype.rollNPC
 * @param {object} [options]  Passed to rollInitiative. formula, updateTurn, messageOptions
 */
export async function rollNPCCombat(options={}) {
  // Wait until all PCs have rolled.
  const MS_DELAY = 1000;
  const MAX_ITER = 15;
  const combatants = [...this.combatants];

  const allPCsRolled = () => combatants.every(c => !c.isOwner || c.isNPC || c.initiative !== null);
  const delay = () => new Promise(resolve => setTimeout(resolve, MS_DELAY));

  let iter = 0;
  while ( iter < MAX_ITER && !allPCsRolled() ) {
    iter += 1;
    await delay();
  }

  if ( !allPCsRolled() ) {
    ui.notifications.warn("Roll NPC timed out waiting for PCs to roll first!");
    return this;
  }

  // Then do the rollAll for the remaining
  return await this.rollAll(options);
}


/**
 * Wrap Combat.prototype._sortCombatants.
 * Define how the array of Combatants is sorted.
 * As opposed to Foundry default, here the Combatants are initially sorted by
 * initiative bonus. Then by token name. Bonus is checked every sort so that updates can be reflected.
 * @param {Combatant} a     Some combatant
 * @param {Combatant} b     Some other combatant
 * @returns {number} The sort order.
 */
export function _sortCombatantsCombat(a, b) {
  const aHasInit = Number.isNumeric(a.initiative);
  const bHasInit = Number.isNumeric(b.initiative);

  const aRank = a.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK);
  const bRank = b.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK);

  // Sort those that have rolled initiative first.
  if ( aHasInit ^ bHasInit ) return (bHasInit - aHasInit) || (bRank - aRank);

  // Given the above test, ia and ib will either both have initiative or both have bonuses.
  const ia = aHasInit ? a.initiative : initBonus(a.token);
  const ib = bHasInit ? b.initiative : initBonus(b.token);
  return (ib - ia) || a.token.name.localeCompare(b.token.name);
}


/**
 * Determine the initiative bonus for a given token.
 * See https://github.com/foundryvtt/dnd5e/blob/bdc76e271d1ebae7092824c4f0e7c5299d7172e4/module/documents/actor/actor.mjs#L1434
 * @param {Token} token     Token to test
 * @returns {number} Bonus amount
 */
function initBonus(token) {
  if ( game.system.id !== "dnd5e" ) return Number.NEGATIVE_INFINITY;

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
  const abilityId = init?.ability || CONFIG.DND5E.initiativeAbility;
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

/*
PCs:      Init    Rank
Riswynn   11.15   0
Zanna     10.12   2

NPCs:
Beiro     null    1
Giant Ape 14.14   null
Morthos    5.12   null
Ogre       2.08   null

*/





