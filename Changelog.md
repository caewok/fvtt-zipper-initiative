## 0.3.1
Workaround for Dice-so-nice throwing an error when rolling for NPCs in dnd5e. Closes issue #8.

## 0.3.0
Foundry v13 support. Use 0.2 series for v12.

## 0.2.2
Fix for settings not caching properly and becoming "sticky" until reload.
Fix for zippering in PF2e.
Added `CONFIG.zipperinitiative.initiativeBonus` function which can be modified to change
how the initiative bonus is calculated, if that option is used. Takes a token and returns a bonus number.

## 0.2.1
Fix error re undefined manifest key. Closes #5.
Add setting to allow for interleaving of multiple NPCs between PCs in the initiative. Closes #6.
Add options to use "zipper popcorn" for PCs or NPCs. As suggested by @EpsilonRose, when a PC ends their
turn and 2+ PCs remain in the initiative order, a dialog allows the PC to select from remaining PCs to go next.
(Not immediately next, but the next PC slot in the zipper order.) Similarly, the DM can do the same for NPCs. Closes #4.
Switched to using Patcher class.
Switched to using Settings class.

## 0.2.0
FoundryVTT v12 compatibility. Addressed some deprecations, which means this module needs v12 to work.

## 0.1.3
Add setting to control whether Dice-So-Nice rolls are used when rolling initiative for all NPCs or all combatants. Closes #3.
Addressed a deprecation warning re `CONFIG.DND5E.initiativeAbility`. Closes #2.

## 0.1.2
Add game setting to select leader by best initiative (versus the default: by best initiative bonus). Closes issue #1.

## 0.1.1
Fix for user permission errors.

## 0.1.0
Verified for v11.

## 0.0.2
Change name to Zipper Initiative and repository to fvtt-zipper-initiative.

## 0.0.1

Initial release. Zip order for combatants should be system independent. For dnd5e, initiative bonuses are used to initially sort and automatically identify a leader. Setting provided to force initiative reset each turn.
