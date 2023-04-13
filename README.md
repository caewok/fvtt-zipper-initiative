[![Version (latest)](https://img.shields.io/github/v/release/caewok/fvtt-zip-initiative)](https://github.com/caewok/fvtt-zip-initiative/releases/latest)
[![Foundry Version](https://img.shields.io/badge/dynamic/json.svg?url=https://github.com/caewok/fvtt-zip-initiative/releases/latest/download/module.json&label=Foundry%20Version&query=$.compatibility.minimum&colorB=blueviolet)](https://github.com/caewok/fvtt-zip-initiative/releases/latest)
[![License](https://img.shields.io/github/license/caewok/fvtt-zip-initiative)](LICENSE)
![Latest Release Download Count](https://img.shields.io/github/downloads/caewok/fvtt-zip-initiative/latest/module.zip)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fzipinitiative&colorB=4aa94a)

# Zip Initiative

This module uses the zip initiative as described by [@Taking20](https://www.youtube.com/@Taking20) in [YouTube](https://www.youtube.com/watch?v=SXleyDvtqls).


# Installation

Add this [Manifest URL](https://github.com/caewok/fvtt-zip-initiative/releases/latest/download/module.json) in Foundry to install.

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
- Assign initiative to rest of NPCs by alternating between PCs and NPCs.

# Usage

## NPC leader
The module will use the following rules to select the NPC leader:
1. If NPCs rolled manually, the NPC with the highest bonus will be chosen. If bonus cannot be determined, the NPC will be selected at random.
2. If NPCs did not roll manually, the NPC with the highest bonus will be chosen. If bonus cannot be determined, the NPC will be selected at random.

## Sort order
When adding tokens to the combat tracker, combatants will initially be sorted by their initiative bonus, with ties sorted alphabetically by name of the token.

Combatants that have rolled initiative will be sorted by initiative above those that have not yet rolled.

## Manual rolls of individual combatants
Any PC or NPC combatant can roll manually as normal, using the die next to their name. NPC combatants rolled manually will not have their initiative modified, except when:
1. Initiative bonus can be determined and the NPC is the highest combatant; or
2. Initiative bonus cannot be determined and the NPC is selected as the highest combatant.

Rolling a single NPC manually acts as an override, causing that NPC to be considered the highest regardless of initiative bonus. If multiple NPCs are rolled manually, it is assumed the GM wants one of those NPCs to be considered the highest---chosen by highest initiative bonus if available or randomly otherwise.

## Roll NPCs button
If the GM hits the roll NPC button, the highest NPC rolls for initiative if no NPCs have yet rolled, and the system waits for PCs to finish rolling before proceeding. PCs and NPCs are then zip sorted.

## Roll All button
If the GM hits the Roll All button, all PCs are rolled automatically, followed by determination of the highest NPC and zip sorting.

## Resulting order
In general, PCs and NPCs are sorted alternating (zip order). If the highest PC initiative beats the NPC leader initiative, that PC goes first. Otherwise, the NPC goes first.

Order may be further modified by the following:
- Any NPC other than the leader that has manually rolled will keep its initiative roll.
- Unrolled NPCs will be assigned an initiative one lower than the relevant PC. This may cause PCs with tied initiatives to be next to one another in the order. Using the dexterity as a tie-breaker setting (for dnd5e) will make such ties less likely.

## Options

