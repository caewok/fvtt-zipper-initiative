[![Version (latest)](https://img.shields.io/github/v/release/caewok/fvtt-zipper-initiative)](https://github.com/caewok/fvtt-zipper-initiative/releases/latest)
[![Foundry Version](https://img.shields.io/badge/dynamic/json.svg?url=https://github.com/caewok/fvtt-zipper-initiative/releases/latest/download/module.json&label=Foundry%20Version&query=$.minimumCoreVersion&colorB=blueviolet)](https://github.com/caewok/fvtt-zipper-initiative/releases/latest)
[![License](https://img.shields.io/github/license/caewok/fvtt-zipper-initiative)](LICENSE)

![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https://forge-vtt.com/api/bazaar/package/zipperinitiative&colorB=4aa94a)
![Latest Release Download Count](https://img.shields.io/github/downloads/caewok/fvtt-zipper-initiative/latest/module.zip)
![All Downloads](https://img.shields.io/github/downloads/caewok/fvtt-zipper-initiative/total)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H2H3Y7IJW)

# Zipper Initiative

This module uses the zipper initiative as described by [@Taking20](https://www.youtube.com/@Taking20) in [YouTube](https://www.youtube.com/watch?v=SXleyDvtqls).

Under zipper initiative, PCs and NPCs are sorted alternating in the initiative order. One (mostly aesthetic) change from @Taking20 is that an NPC will be given initiative equal to the PC that it goes after, instead of one less initiative value. This is primarily to better resolve ties without losing the alternating order, as well as to more easily resolve initiative that uses Dexterity to break ties.

# Installation

Add this [Manifest URL](https://github.com/caewok/fvtt-zipper-initiative/releases/latest/download/module.json) in Foundry to install.

## Dependencies
- [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper)

# Systems

For dnd5e, combatants will be sorted by initiative bonus and the highest NPC will be automatically rolled as necessary.

For other systems, GMs have two options:
- Roll the highest NPC.
- Let the module select an NPC at random to roll.

If you would like the system you use to have automatic detection of initiative bonuses, please submit an issue in the git and identify where I can find the initiative bonus rules for your system.

# Rules
- Players roll initiative as normal.
- DM rolls initiative for one NPC—--the one with the highest initiative bonus. This is the "NPC leader."
- Determine if the PCs or NPC won by comparing the NPC roll to that of the highest PC roll.
- Assign initiative to rest of NPCs by alternating between PCs and NPCs in the initiative order.

# Usage

## NPC leader
The module will use the following rules to select the NPC leader:
1. If a single NPC rolled manually, it is assumed to be the leader.
2. If multiple NPCs rolled manually, the one with the highest bonus will be the leader. (Note that in this scenario, the leader might not have the highest initiative roll.)
3. If no NPCs rolled, the NPC with the highest bonus will be chosen.
4. If bonus cannot be determined, the NPC will be selected at random from the relevant group.

## Sort order
When adding tokens to the combat tracker, combatants will initially be sorted by their initiative bonus, with ties sorted alphabetically by name of the token.

Combatants that have rolled initiative will be sorted by initiative, above those that have not yet rolled.

If the highest PC initiative beats the NPC leader initiative, that PC goes first. Otherwise, the NPC goes first. After initiative is rolled, most NPCs will have their initiative set to a paired PC, or be pushed to the end of the queue. A ranking system is used internally to sort NPCs and PCs that have the same initiative score.

## Manual rolls of individual combatants
Any PC or NPC combatant can roll manually as normal, using the die next to their name. NPC combatants rolled manually will not have their initiative modified, except when the NPC is the leader and loses initiative to the PCs.

1. Initiative bonus can be determined and the NPC is the highest combatant; or
2. Initiative bonus cannot be determined and the NPC is selected as the highest combatant.

Rolling a single NPC manually acts as an override, causing that NPC to be considered the highest regardless of initiative bonus. If multiple NPCs are rolled manually, it is assumed the GM wants one of those NPCs to be considered the highest---chosen by highest initiative bonus if available or randomly otherwise.

## Roll NPCs button
If the GM hits the roll NPC button, the highest NPC rolls for initiative if no NPCs have yet rolled, and the system waits for PCs to finish rolling before proceeding. PCs and NPCs are then zipper sorted.

## Roll All button
If the GM hits the Roll All button, all PCs are rolled automatically, followed by determination of the highest NPC and zipper sorting.

## Settings
A setting is available to force initiative to reset every round.

## Configs
A config is available to adjust the timeout delay when the Roll NPCs button is used.
