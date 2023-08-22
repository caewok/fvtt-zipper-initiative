/* globals
Hooks,
game,
showdown,
Dialog
*/
"use strict";

import { MODULE_ID } from "./const.js";
import { SETTINGS, getSetting, setSetting } from "./settings.js";
const CHANGELOG = SETTINGS.CHANGELOG;

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
          Per @GhostwheelX's request, added a game setting that to choose the NPC leader based on the best NPC initiative roll,
          instead of by best NPC bonus to initiative. Note that you can still manually roll a single NPC, which will then become the leader,
          or multiple NPCs, in which case the leader will be chosen amongst those manually rolled.
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
    const curr = getSetting(CHANGELOG);
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
          callback: () => setSetting(CHANGELOG, next)
        }
      },
      default: "dont_show_again"
    });
  }
}
