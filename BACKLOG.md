# Backlog

This used to be the whole list. From here on, [GitHub Issues](https://github.com/codentide/pullwise/issues)
are — one repo, one live list, no duplicate that drifts out of sync with itself.

## Open

| # | What | Why it's labelled that way |
| --- | --- | --- |
| [#1](https://github.com/codentide/pullwise/issues/1) | Generate the in-game deck code (QR) | `priority:high` — closes the entire loop this app exists for |
| [#2](https://github.com/codentide/pullwise/issues/2) | Shareable deck URLs with an OG image | Pairs with #1: the link people actually post |
| [#3](https://github.com/codentide/pullwise/issues/3) | Deploy Pullwise | `priority:high` — nobody but the developer can open the app today |
| [#4](https://github.com/codentide/pullwise/issues/4) | Use the app by hand at least once | Every check so far has gone through Playwright, never a person |
| [#5](https://github.com/codentide/pullwise/issues/5) | Rewrite the README in English | It still describes the pre-Next structure, in Spanish |
| [#6](https://github.com/codentide/pullwise/issues/6) | Fill the empty space in the pack page's header | Validated: the release date and sibling packs are both real, unused data |
| [#7](https://github.com/codentide/pullwise/issues/7) | Type data for B3 onwards | `on-demand` — no code to write, waiting on upstream |
| [#8](https://github.com/codentide/pullwise/issues/8) | Spanish card art | `on-demand` — same shape of wait |
| [#9](https://github.com/codentide/pullwise/issues/9) | Real pull rates for B4 and B4a | `on-demand` — the fallback already empties itself when this lands |
| [#10](https://github.com/codentide/pullwise/issues/10) | Accounts and cross-device sync | `needs clarification` — v2, and genuinely undecided, not just unbuilt |

## Resolved, not through an issue

Things closed before the repo had issues to close, kept here so the reasoning
isn't lost:

- **The decklist parser had never been tested against a real export.** Pasting
  one for the first time found a genuine bug — 13 of the 23 sets carry a
  lowercase-suffixed code (`B1a`, `A2b`...) and the parser was force-uppercasing
  it, silently resolving to the wrong printing. Fixed, with a regression test
  (`292ee0bf`).
- **The energy zone.** `src/lib/energy.ts` infers it from the deck's own
  Pokémon; `Deck.energy` holds an explicit override once the player touches a
  symbol or pastes a decklist that names one.
- **No git.** Pushed: https://github.com/codentide/pullwise
