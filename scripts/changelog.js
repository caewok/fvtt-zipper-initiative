/* globals
Hooks,
game,
showdown,
Dialog,
window
*/
"use strict";

import { MODULE_ID } from "./const.js";
import { Settings } from "./settings.js";
const CHANGELOG = Settings.KEYS.CHANGELOG;

// From Perfect Vision
// https://github.com/dev7355608/perfect-vision/blob/cdf03ae7e4b5969efaee8e742bf9dd11d18ba8b7/scripts/changelog.js


Hooks.once("ready", () => {
  if (!game.user.isGM) {
    return;
  }

  game.settings.register(
    MODULE_ID,
    CHANGELOG,
    {
      scope: "client",
      config: false,
      type: Number,
      default: 0
    }
  );

  new ChangelogBuilder()
    .addEntry({
      version: "0.0.2",
      title: "Welcome to Zipper Initiative!",
      body: `\
          Zipper Initiative uses the initiative strategy described by [@Taking20](https://www.youtube.com/@Taking20)
          in [YouTube](https://www.youtube.com/watch?v=SXleyDvtqls). Under zipper initiative,
          PCs and NPCs are sorted alternating in the initiative order, with a single NPC "leader"
          used to determine which side goes first.

          **Manual Rolls**: Rolling a single NPC manually will cause that combatant to be the NPC leader. Rolling
          multiple NPCs manually will cause one to be selected leader and the others to keep their
          initiative score, ignoring zip sort for those combatants only.

          **Reset Initative setting**: A setting is provided to optionally force initiative to be reset each round.
          `
    })

    .addEntry({
      version: "0.1.0",
      title: "v11",
      body: `\
          Zipper Initiative verified with v11.
          `
    })

    .addEntry({
      version: "0.1.2",
      title: "NPC Leader Option",
      body: `\
          Per @GhostwheelX's request, I added a game setting that to choose the NPC leader based on the best NPC initiative roll,
          instead of by best NPC bonus to initiative. Note that you can still manually roll a single NPC, which will then become the leader,
          or multiple NPCs, in which case the leader will be chosen amongst those manually rolled.
          `
    })

    .addEntry({
      version: "0.1.3",
      title: "Dice-So-Nice Setting",
      body: `\
          Per @noncasus's request, I added a game setting that will force Dice-So-Nice initiative rolls when rolling for
          all NPCs or all tokens. The rolls reflect real calculations that are used to order the NPCs, but
          ultimately their initiative may differ dramatically from the rolls to facilitate the zipper initiative order.
          `
    })

    .addEntry({
      version: "0.2.1",
      title: "Zipper Popcorn and Interleaving",
      body: `\
          Per @EpsilonRose's request, I added two settings that enable a "zipper popcorn" option for PC and NPC groups.
          When a PC ends their turn with 2+ PCs left in the initiative order, a dialog will allow the PC to
          select the next PC to go (still in zipper order). Essentially, the next PC in the initiative and the
          chosen PC switch spots. A similar dialog is presented to the GM when 1+ PCs remain in the initiative.

          Per @GhostwheelX's request, I added a setting to interleave the NPCs when there are more NPCs than PCs.
          Spacing will be approximately equal. For example, with 2 PCs and 5 NPCs, you could get
          P N N P N N instead of P N P N N N.
          `
    })

    .build()
    ?.render(true);
});


/**
 * Display a dialog with changes; store changes as entries.
 */
class ChangelogBuilder {
  #entries = [];

  addEntry({ version, title = "", body }) {
    this.#entries.push({ version, title, body });
    return this;
  }

  build() {
    const converter = new showdown.Converter();
    const curr = Settings.get(CHANGELOG);
    const next = this.#entries.length;
    let content = "";

    if (curr >= next) {
      return;
    }

    for (let [index, { version, title, body }] of this.#entries.entries()) {
      let entry = `<strong>v${version}</strong>${title ? ": " + title : ""}`;

      if (index < curr) {
        entry = `<summary>${entry}</summary>`;
      } else {
        entry = `<h3>${entry}</h3>`;
      }

      let indentation = 0;

      while (body[indentation] === " ") indentation++;

      if (indentation) {
        body = body.replace(new RegExp(`^ {0,${indentation}}`, "gm"), "");
      }

      entry += converter.makeHtml(body);

      if (index < curr) {
        entry = `<details>${entry}</details><hr>`;
      } else if (index === curr) {
        entry += "<hr><hr>";
      }

      content = entry + content;
    }

    return new Dialog({
      title: "Zipper Initiative: Changelog",
      content,
      buttons: {
        view_documentation: {
          icon: `<i class="fas fa-book"></i>`,
          label: "View documentation",
          callback: () => window.open("https://github.com/caewok/fvtt-zipper-initiative/blob/master/README.md")
        },
        dont_show_again: {
          icon: `<i class="fas fa-times"></i>`,
          label: "Don't show again",
          callback: () => Settings.set(CHANGELOG, next)
        }
      },
      default: "dont_show_again"
    });
  }
}
