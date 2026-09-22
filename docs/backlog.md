# Backlog

This used to be the whole list. From here on, [GitHub Issues](https://github.com/codentide/pullwise/issues)
are — one repo, one live list, no duplicate that drifts out of sync with itself.

## Open

| # | What | Why it's labelled that way |
| --- | --- | --- |
| [#2](https://github.com/codentide/pullwise/issues/2) | Shareable deck URLs with an OG image | Pairs with the closed #1: the link people actually post |
| [#3](https://github.com/codentide/pullwise/issues/3) | Deploy Pullwise | `priority:high` — nobody but the developer can open the app today |
| [#4](https://github.com/codentide/pullwise/issues/4) | Use the app by hand at least once | Every check so far has gone through Playwright, never a person |
| [#6](https://github.com/codentide/pullwise/issues/6) | Fill the empty space in the pack page's header | Validated: the release date and sibling packs are both real, unused data |
| [#7](https://github.com/codentide/pullwise/issues/7) | Type data for B3 onwards | `on-demand` — no code to write, waiting on upstream |
| [#8](https://github.com/codentide/pullwise/issues/8) | Spanish card art | `on-demand` — same shape of wait |
| [#9](https://github.com/codentide/pullwise/issues/9) | Real pull rates for B4 and B4a | `on-demand` — the fallback already empties itself when this lands |
| [#10](https://github.com/codentide/pullwise/issues/10) | Accounts and cross-device sync | `needs clarification` — a "when," not an "if," but the auth method, backend and deck-URL model interaction are still undecided |
| [PWS-011](https://github.com/codentide/pullwise/issues/11) | Show full card details in a hover/tap popover | Feasibility checked before filing: TCGdex has real attacks/abilities/HP, `sync-data.mjs` just doesn't pull them yet |
| [PWS-014](https://github.com/codentide/pullwise/issues/14) | Generate our own pack/set logo assets, English and Spanish | `priority:low` — no external source has usable coverage (checked live: TCGdex has zero logos in Spanish, and its English coverage doesn't reach B4a) |
| [PWS-015](https://github.com/codentide/pullwise/issues/15) | Translate element, weakness and rarity-grade names on /es pages | An existing, working `energies` i18n namespace sits unused on the card detail page, and Pullwise's own rarity grades have no i18n at all |
| [PWS-016](https://github.com/codentide/pullwise/issues/16) | Find vector versions of the 10 energy-type icons | `needs research` — Bulbagarden Archives (today's PNG source) has no SVG variant; a couple of unconfirmed leads noted for next time |

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

## Closed

- [#1](https://github.com/codentide/pullwise/issues/1) — Generate the in-game
  deck code (QR). `deckBuilderNr` is real data (`sync-data.mjs`, verified
  3,879/3,879 resolve); `src/lib/deckCode.ts` builds and round-trip-tests the
  code; generation works on an incomplete deck (the 20-card gate was ours, not
  the format's); the dialog shows the deck's size and the energy actually
  encoded, filtered to the 8 the game's Energy Zone really offers.
- [#5](https://github.com/codentide/pullwise/issues/5) — Rewrite the README in
  English. Also added `CONTRIBUTING.md`, an MIT `LICENSE`, and CI.
- [PWS-013](https://github.com/codentide/pullwise/issues/13) — Show which
  missing cards a recommended pack actually yields. `PackRanking` already
  computed `coveredHere`; now the winner pack and every "other pack" row have
  a collapsed-by-default "Show cards" toggle naming them (name + rarity).
