# Pullwise — design foundations brief

Paste this whole file. It is self-contained.

## What it is

A tool for **Pokémon TCG Pocket** players (the mobile collectible card game).
It answers one question: *I am short these cards for the deck I want — which pack
should I open?*

The game has 3,879 cards across 23 sets. Each set opens with its own packs, and
each pack has its own per-rarity odds. Pullwise crosses the deck you are building
against what you are missing and works out which pack to open and how many it will
take.

## The insight the whole product hangs on

Existing trackers ask you to log your entire collection before they do anything.
That is 3,879 decisions, so nobody does it. It cannot be automated either: the
game exposes no account API.

Pullwise inverts the model: **the unit of work is the deck, not the collection.**
A deck is 20 cards, so knowing what you are missing costs a handful of clicks.

From that follows the rule the design must never break:

> A card the user never touched is **unknown**, which is not the same as "I don't
> have it". The interface never asks them to complete anything, never shows a
> progress bar over 3,879, and never makes them feel they owe the app work.

Adding a card to a deck assumes **you own it** — you build with what you have, and
what is missing is the exception you mark in the moment.

## Card states

Four of them, and they must be distinguishable at a glance in a grid of hundreds:

| State | Meaning |
| --- | --- |
| Unknown | Never marked. The default for almost the entire catalogue. |
| Complete | You own every copy the deck asks for (1 or 2). |
| Partial | You own one of the two the deck asks for. |
| Missing | You own none. |

## Screens

**Decks** — a list. Each shows its name, card count out of 20, a glimpse of its
first cards, and how many are missing. Created empty or by pasting a decklist.

**Deck editor** — up to 20 cards in a grid. Per card: how many copies the deck
asks for, and how many you own. Alongside: live rule validation (exactly 20, max 2
per name, evolutions without their line) and the calculation result. Below, a
filtered search to add cards.

**Catalogue** — all 3,879 cards, filtered by set, kind, energy and rarity. It is
also the collection view: one filter shows only what the user has marked. Marking
here is optional and never requested.

**Packs** — the ranking, for one deck or all of them.

**Public pages** — one per card, set and pack, statically generated in both
locales (7,866 pages). These are the entry point from search engines and have a
lighter chrome than the app: they are read once by a stranger, not lived in.

## The numbers, and their hierarchy

The result is three figures that compete for attention and **are not worth the
same**:

1. **Packs to finish it** — the lead number. An integer, with a second "with bad
   luck" figure (90th percentile). E.g. *125 typical · 240 with bad luck*.
2. **Chance of a useful card** — a percentage per pack, one decimal. It orders the
   ranking because it reads without explanation (*3.3%*).
3. **Useful copies per pack** — the expectation. The most precise and the least
   intuitive: it goes in small type (*0.03/pack*).

A ranking row shows up to 6 packs: the pack's name (the game names them after a
mascot — "Mewtwo", "Charizard", "Pikachu"), its set, and the figures. A pack can
carry an **estimated** marker when its set has not published real odds yet.

## Hard constraints

- **Card art is ultra-saturated** — full-colour illustration, gold borders, solid
  energy-coloured backgrounds. Any strong chroma in the interface competes with it
  and the result is noise. This constrains the design more than anything else.
- Exact ratio **367 × 512** (0.7168). The space must be reserved or the page jumps
  while images load.
- ~45 KB each, hundreds per grid. Lazy loading is mandatory.
- **English only.** Card art and card names exist in English alone, even when the
  interface is in Spanish. (Spanish art covers 44% of cards and none of the 2026
  sets, so a deck would render half in each language.)
- Interface ships in **English and neutral Spanish**. Layouts must survive Spanish
  running roughly 20% longer.
- The catalogue grid must show most of a set without scrolling.

## What already exists — build on this, do not restart

Dark, neutral, Swiss/minimal. One cool accent; every other colour is functional.
All ratios below are verified by a test that fails the build.

```
Surfaces   bg #0e1013 · surface #15181d · surface-2 #1c2027 · surface-3 #242932
Lines      line #272c34 · line-strong #39404a · line-control #5c646f (3.18:1)
Text       ink #e8eaed (15.8:1) · ink-dim #9aa1ab (7.3:1) · ink-faint #7c838e (4.98:1)
Accent     accent #4da3ff (7.3:1) · accent-soft #4da3ff1f
Semantic   have #3fbf7f · miss #ff6b5a · warn #f5b544
Energies   grass #63bc5a · fire #ff9c54 · water #4d9ad4 · lightning #f4d23c
           psychic #f97176 · fighting #ce4069 · darkness #8b82a0 · metal #8a8a9e
           dragon #c9a227 · colorless #9aa1ab        (all ≥ 3:1 on bg)
Type       system stack, no webfonts. Tabular figures everywhere numbers appear.
           11 / 12 / 13 / 15 / 18 / 24 / 32 px — dense, it is a tool
Radii      3 / 5 / 8 / 12 px
Motion     150ms micro, 200ms hover. prefers-reduced-motion honoured.
```

Ten energy symbols are drawn in-house as inline SVG (the open icon sets cover the
eighteen *video game* types, a different list with different glyphs).

## What I want from foundations

Take the tokens above as the starting point and give me the layer that is missing:
a component vocabulary with real specs. Specifically — the four card states as a
visual system that survives a dense grid; the ranking row, which today is the
weakest piece; how an estimate should look next to a hard number so the difference
reads instantly; and the relationship between the app's chrome and the public
pages' chrome, which should feel like one product without being the same density.

## What I do not want

- Holographic or iridescent effects. They evoke the cards but compete with the
  real art and age badly.
- Gamification: streaks, achievements, catalogue completion percentages. They
  contradict the core insight — the app asks nothing of you.
- Emoji as icons.
- Custom illustration or mascots. The content already brings 3,879 illustrations.
