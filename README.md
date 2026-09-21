# Pullwise

[![CI](https://github.com/codentide/pullwise/actions/workflows/ci.yml/badge.svg)](https://github.com/codentide/pullwise/actions/workflows/ci.yml)

Which pack to open in Pokémon TCG Pocket to finish the deck you're building.

## The problem

Every existing tracker asks you to log your whole collection — 3,879 cards —
before it does anything useful. Nobody does that. And it can't be automated:
**The Pokémon Company and DeNA expose no API for the in-game account**, so
there is no way to import what you already have (the trackers that claim to
"sync" are running OCR on screenshots).

Pullwise flips the model: **the unit of work is the deck, not the
collection**. You build a 20-card deck, mark the handful of cards you're
missing, and the app tells you which pack to open and roughly how many
you'll need.

A card you've never touched stays **unknown** — not the same thing as "I
don't have it." The app never asks you to complete anything; your collection
grows on its own, as a side effect of building decks.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # verify, then generate ~3,900 static pages in ~10s
pnpm verify       # lint + typecheck + tests
pnpm sync:data    # refresh the dataset when a new set ships
```

## Architecture

Next 16 (App Router) on React 19 and Tailwind 4. The split is simple, and it
shows up as two route groups under `src/app/[locale]/`:

- **`(site)` — static and public.** One page per card (3,879), set (23) and
  pack (29), generated at build time so they can be found on Google: every
  card is a real search ("*pikachu ex which pack*"). The odds there are
  computed analytically — for a single card the wait is geometric, so the
  mean is `1/p` and nothing needs to be simulated.
- **`(app)` — interactive and private.** The deck-building tool, entirely
  client-side. Your collection never leaves your browser.

The domain (`src/lib/`, no React in it) doesn't import React: the pack math,
the deck rules and the decklist parser run identically on the server, in the
browser, and in the test suite.

## How the odds are computed

A pack has 5 independent slots. Each slot rolls a rarity from its own table,
then a card uniformly among the ones that rarity can yield from that pack:

```
P(slot i yields card c) = rate(i, rarity(c)) / pool(set, pack, rarity(c))
```

Everything is averaged across a pack's two variants (the common one and the
0.05% rare pack), weighted by how often each shows up. That's where the
interface's three numbers come from:

- **Useful-card chance** — `1 − Π(1 − p_slot)`, the probability a pack yields
  at least one card you're missing. Shown large because it needs no
  explanation.
- **Expected useful copies per pack** — the mean. Slightly over-counts when a
  pack yields more copies than you need; it doesn't change the ranking.
- **Packs to finish it** — a 400-run Monte Carlo that always opens whichever
  pack is best for what's still missing *at that point*. The only one of the
  three that correctly models needing two copies of the same card.

The simulation is seeded from a hash of what's missing, so the same deck
always returns the same number — an estimate that changes on every reload
isn't one you can trust.

## Data

[`flibustier/pokemon-tcg-pocket-database`](https://github.com/flibustier/pokemon-tcg-pocket-database)
(MIT). `pnpm sync:data` pulls it and commits the result under `src/data/`, so
the app never depends on that CDN at runtime. Card art comes from the
Limitless CDN.

The sync script works around three things the source ships broken — worth
knowing if you ever touch it:

- `cards.extra.json` (the deck-building metadata) is **incomplete** — about
  1,300 cards are missing from it. It's merged onto `cards.min.json`, which
  does have the full catalog.
- **New sets ship with no pull rates.** They inherit the previous set of the
  same format's rates (`B4←B3`, `B4a←B3a`), and the UI marks those as
  *estimated*.
- `sets.json` and `cards.json` disagree on which packs `B4a` has. The cards
  win.

## What it doesn't do

- **It doesn't sync with your in-game account.** There is no way to.
- Card art and names are **English-only** — the CDN doesn't publish other
  languages.
- Evolution-line validation is best-effort. The dataset has no metadata for
  about 700 cards from the newest sets; for those, the app says it can't
  tell rather than falsely flagging a legal deck.
- State lives in `localStorage` — no accounts, no sync across devices (that
  would be a v2). That's why the header has **Export / Import**: use it,
  `localStorage` does get cleared on its own. It does sync across tabs in the
  same browser.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: `pnpm verify` has
to be green, and [`CLAUDE.md`](CLAUDE.md) is the actual house style guide —
most of this codebase was written by AI agents, so the rules that matter are
written down rather than assumed.

## License

[MIT](LICENSE).
