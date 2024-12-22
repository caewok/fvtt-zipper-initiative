/* globals
CONFIG,
game,
ui,
Hooks
*/
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
"use strict";

import { MODULE_ID, FLAGS, MODULES_ACTIVE } from "./const.js";
import { getSetting, SETTINGS } from "./settings.js";

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

async function createCombatantHook(combatant, _options, id) {
  if ( id !== game.user.id ) return;
  await resetInitRank(combatant);
}

/**
 * Hook updateCombat.
 */
Hooks.on("updateCombat", updateCombatHook);

async function updateCombatHook(combat, _change, _opts, id) {
  if ( id !== game.user.id ) return;
  combat.combatants.forEach(c => {
    if ( c.initiative === null ) resetInitRank(c); // TO-DO: Do we need to await this function?
  });
}

/**
 * Hook combatRound.
 */
Hooks.on("combatRound", combatRoundHook);

async function combatRoundHook(combat, _updateData, opts) {
  if ( !getSetting(SETTINGS.RESET_EACH_ROUND) || opts.direction < 0 ) return;
  await combat.resetAll();
}




/**
 * When interleaving, max number of NPCs in first group?
 * @param {number} numPCs
 * @param {number} numNPCs
 * @param {bool} PCsWon
 * @returns {number}
 */
function numberNPCsInFirstGroup(numPCs, numNPCs, PCsWon) {
  if ( numNPCs < 1 ) return 0;
  if ( numPCs >= numNPCs ) return 1; // E.g. pnpn or npnp
  if ( !PCsWon && numPCs >= (numNPCs - 1) ) return 1; // E.g. npnpn

  // Always tries to put NPCs in a final group.
  const numGroups = PCsWon ? numPCs : (numPCs + 1);
  return Math.floor(numNPCs / numGroups);
}

/**
 * Select the combatant by highest bonus.
 * @param {object} maxNPC
 *   - @prop {number} initBonus
 *   - @prop {Combatant|null} combatant
 * @param {Combatant} c
 * @returns {object} Same structure as maxNPC
 */
function selectByBonus(maxNPC, c) {
  const bonus = initBonus(c.token);
  if ( bonus > maxNPC.initBonus ) {
    maxNPC.initBonus = bonus;
    maxNPC.combatant = c;
  }
  return maxNPC;
}

/**
 * Select the combatant by highest initiative.
 * @param {object} maxNPC
 *   - @prop {number} initBonus
 *   - @prop {Combatant|null} combatant
 * @param {Combatant} c
 * @returns {object} Same structure as maxNPC
 */
function selectByInitiative(maxNPC, c) {
  if ( c.initiative > maxNPC.initBonus ) {
    maxNPC.initBonus = c.initiative;
    maxNPC.combatant = c;
  }
  return maxNPC;
}

/**
 * Select the leader NPC.
 * Select the candidate with the highest bonus; random otherwise.
 * If NPC_LEADER_HIGHEST is enabled, use highest initiative instead.
 * @param {Combatant[]} candidates
 * @returns {Combatant}
 */
function selectNPCLeader(candidates) {
  const leaderSelectionFn = getSetting(SETTINGS.NPC_LEADER_HIGHEST_INIT) ? selectByInitiative : selectByBonus;
  const leaderNPC = candidates.reduce(leaderSelectionFn, { initBonus: Number.NEGATIVE_INFINITY, combatant: null });

  // Fall back on random selection
  if ( !leaderNPC ) leaderNPC.combatant = candidates[Math.floor(Math.random() * candidates.length)];
  return leaderNPC.combatant;
}

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

  // Roll NPC initiative and sort by that initiative
  for ( const npc of NPC.unrolled ) {
    const roll = npc.getInitiativeRoll();
    await roll.evaluate();

    // Force DSN to show the roll despite not going to chat.
    // https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/wikis/API/Roll
    if ( MODULES_ACTIVE.DSN
      && game.settings.get(MODULE_ID, SETTINGS.USE_DSN) ) game.dice3d.showForRoll(roll, game.user, true); // Async, but need not await.
    npc._zipInit = roll.total;
  }
  NPC.unrolled.sort((a, b) => b._zipInit - a._zipInit);

  // Sort PCs by initiative
  PC.rolled.sort((a, b) => b.initiative - a.initiative);

  // Determine the leader NPC.
  const leaderNPC = selectNPCLeader(NPC.rolled.length ? NPC.rolled : NPC.unrolled);

  // Remove leader from the unrolled array
  const index = NPC.unrolled.indexOf(leaderNPC);
  if ( ~index ) NPC.unrolled.splice(index, 1);

  // Determine if the PCs or the NPC leader rolled the best initiative
  const bestPCInit = PC.rolled[0]?.initiative ?? Number.NEGATIVE_INFINITY;
  const leaderInit = leaderNPC.initiative ?? leaderNPC._zipInit;
  const PCsWon = bestPCInit >= leaderInit;

  // We don't need the rolled and unrolled arrays anymore, so just copy over them.
  PC.remaining = PC.rolled;
  NPC.remaining = NPC.unrolled;
  const interleaveNPCs = getSetting(SETTINGS.INTERLEAVE_NPCS);
  let rank = Number(!PCsWon); // PCsWon: 0; PCsLost: 1

  if ( PCsWon ) {
    // Leader requires a new initiative to place in zip order.
    NPC.remaining.unshift(leaderNPC);
  } else {
    // Leader has the highest initiative; keep and rank 0.
    updates.push({ _id: leaderNPC.id, initiative: leaderInit});
    await leaderNPC.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, 0);

    if ( interleaveNPCs ) {
      // Add in additional NPCs. Minus one for the leader.
      const numAdditional = numberNPCsInFirstGroup(PC.remaining.length, NPC.remaining.length, PCsWon) - 1;
      for ( let i = 0; i < numAdditional; i += 1 ) {
        const currNPC = NPC.remaining.shift();
        updates.push({ _id: currNPC.id, initiative: leaderInit });
        await currNPC.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, rank++);
      }
    }
  }

//
//   const numNPCsPerGroup = interleaveNPCs ? : 1;
//   if ( interleaveNPCs ) {
//
//   }
//
//   2 PCs:


  // Zip sort remaining unrolled NPCs into PC list
  // PCs won: PC[0] = 0, NPC[0] = 1, PC[1] = 2, NPC[1] = 3...
  // PCs lost: NPC[0] = 0, PC[0] = 1, NPC[1] = 2, PC[1] = 3...
  // While PCs remain, zip sort PC --> NPC.

  while ( PC.remaining.length ) {
    // Treat as PCs won b/c we are adding the PC first
    const numNPCs = interleaveNPCs ? numberNPCsInFirstGroup(PC.remaining.length, NPC.remaining.length, true) : 1;
    const currPC = PC.remaining.shift();
    await currPC.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, rank++);
    for ( let i = 0; i < numNPCs; i += 1 ) {
      const currNPC = NPC.remaining.shift();
      updates.push({ _id: currNPC.id, initiative: currPC.initiative });
      await currNPC.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, rank++);
    }
  }

//   const numPCs = PC.remaining.length;
//   const numNPCs = NPC.remaining.length;
//   let j = 0;
//   let rank = Number(!PCsWon); // PCsWon: 0; PCsLost: 1
//   for ( let i = 0; i < numPCs && j < numNPCs; i += 1, j += 1, rank += 2 ) {
//     const currPC = PC.remaining[i];
//     const currNPC = NPC.remaining[j];
//     updates.push({ _id: currNPC.id, initiative: currPC.initiative });
//     await currPC.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, rank);
//     await currNPC.setFlag(MODULE_ID, FLAGS.COMBATANT.RANK, rank + 1);
//   }

  //   PCswon
  //   rank = 0
  //   currPC = PC[0]
  //   currNPC = NPC[0]
  //   currNPC.init = currPC.init
  //   currPC.rank = 0 (rank)
  //   currNPC.rank = 1 (rank + 1)
  //
  //   ...
  //   rank = 2
  //   currPC = PC[1]
  //   currNPC = NPC[1]
  //   currNPC.init = currPC.init
  //   currPC.rank = 2 (rank)
  //   currNPC.rank = 3 (rank + 1)
  //
  //   PCslost
  //   currNPC[0] is leader, rank 0
  //
  //   rank = 1
  //   currPC = PC[0]
  //   currNPC = NPC[0]
  //   currNPC.init = currPC.init
  //   currPC.rank = 1 (rank)
  //   currNPC.rank = 2 (rank + 1)
  //
  //   ...
  //
  //   rank = 3 (+2)
  //   currPC = PC[1]
  //   currNPC = NPC[1]
  //   currNPC.init = currPC.init
  //   currPC.rank = 3 (rank)
  //   currNPC.rank = 4 (rank + 1)


  // Remainder of NPCs go at the bottom, randomly.
  // To make things interesting, roll their initiatives.
  if ( NPC.remaining.length ) {
    // Shift the remainders' init rolls down to be below the minimum PC
    const maxRemainingInit = Math.max.apply(null, NPC.remaining.map(c => c._zipInit));
    const targetInit = NPC.remaining[0].initiative - 1;
    const shift = maxRemainingInit - targetInit;
    NPC.remaining.forEach(c => updates.push({ _id: c.id, initiative: c._zipInit - shift }));
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
  const MAX_ITER = CONFIG[MODULE_ID].maxSeconds;
  const combatants = [...this.combatants];

  const allPCsRolled = () => combatants.every(c => !c.isOwner || c.isNPC || c.initiative !== null);
  const delay = () => new Promise(resolve => setTimeout(resolve, MS_DELAY)); // eslint-disable-line no-promise-executor-return

  if ( !allPCsRolled() ) ui.notifications.notify(`Waiting ${MAX_ITER} seconds for PCs to roll...`);
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

  const aRank = a.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK) ?? Number.NEGATIVE_INFINITY;
  const bRank = b.getFlag(MODULE_ID, FLAGS.COMBATANT.RANK) ?? Number.NEGATIVE_INFINITY;

  // Sort those that have rolled initiative first.
  if ( aHasInit ^ bHasInit ) return (bHasInit - aHasInit) || (aRank - bRank);

  // Given the above test, ia and ib will either both have initiative or both have bonuses.
  const ia = aHasInit ? a.initiative : initBonus(a.token);
  const ib = bHasInit ? b.initiative : initBonus(b.token);
  return (ib - ia) || (aRank - bRank) || a.token.name.localeCompare(b.token.name);
}


/**
 * Determine the initiative bonus for a given token.
 * See https://github.com/foundryvtt/dnd5e/blob/bdc76e271d1ebae7092824c4f0e7c5299d7172e4/module/documents/actor/actor.mjs#L1434
 * @param {Token} token     Token to test
 * @returns {number} Bonus amount
 */
function initBonus(token) {
  if ( game.system.id !== "dnd5e" || !token.actor ) return Number.NEGATIVE_INFINITY;

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
