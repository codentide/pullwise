# Backlog

Running list. Newest ideas go under **Next up** with enough context that picking
one up does not mean re-doing the research.

---

## Next up

### 1. Generate the in-game deck code (2D pattern / QR)

**Confirmed working, confirmed feasible, and the licence is clean.**

Verified in practice on ptcgpocket.gg: scanning its code built the deck in the
game *even with cards missing*, and the game itself showed which ones were
absent. So the code does not require owning the cards — it imports the deck and
turns the gaps into an in-game shopping list. That makes it the natural next step
after Pullwise tells you what you are short of.

**The format is already reverse engineered and published as MIT.**

- `ptcgp-deckcode@2.0.0` (npm, MIT, published 2026-08-01, one dependency:
  `qrcode`). Source: [`Nirostar/ptcgp-deck-qr`](https://github.com/Nirostar/ptcgp-deck-qr).
- The in-game share QR is a base64-encoded binary blob; the library encodes it.
- It derives each card's internal `deckBuilderNr` **from the same
  `flibustier/pokemon-tcg-pocket-database` we already consume**, so the id
  mapping is not a problem we have to solve.
- API shape: `createDeckQR([1, 1, 4, 4], ['fire', 'grass'])` — deck builder
  numbers plus the deck's energy types.

**Do NOT use `chase-mew/pokemon-tcg-pocket-cards` for this.** It carries the same
logic but its Python port is AGPL-3.0, which for a web app is viral: it would
force all of Pullwise open under AGPL. The upstream Nirostar logic is MIT. Same
code, very different obligation.

**Two gaps to close before it works here**

1. **We do not store `deckBuilderNr`.** `sync-data.mjs` drops the upstream
   `image` field, which is where the internal asset id appears
   (`cPK_10_000960_00_PIKACHUex_RR.webp`). Either keep that field or let the
   library load its own copy of the database.
2. **We do not model the energy zone.** A TCG Pocket deck picks its energy types
   separately from its 20 cards, and the encoder needs them. Today Pullwise has
   no concept of it. That is a real (small) product addition, not just plumbing —
   and it should probably be inferred from the deck's Pokémon by default.

### 2. Shareable deck URLs with an OG image

Encode the deck in the URL (base64 of the card ids — no backend, no database) and
render an Open Graph image per deck. This community lives in Discord and Reddit,
where a link with no preview is dead text. Pairs naturally with #1: one page that
carries both the shareable link and the scannable code.

---

## Known debt

- **The README describes the old structure** and is written in Spanish, against
  the language rule in `CLAUDE.md`. Rewrite in English for the current layout.
- **Nobody has used the app by hand.** Every check so far has been through
  Playwright: keyboard flow, hover states and the Spanish locale in the editor
  are unverified by a human.
- **The decklist parser was never tested against a real Limitless export** —
  only against the documented shape of it.
- **No git, no deploy.**

## Waiting on someone else

- **Spanish card art.** TCGdex covers 11 of 23 sets and none from 2026, so a deck
  would render half in each language. `imageUrl()` already accepts a locale and
  ignores it; when coverage catches up this becomes a data change, not code.
- **Real odds for the newest sets.** `B4` and `B4a` inherit from `B3` and `B3a`.
  `sync-data.mjs` picks the donor and the UI marks those packs *estimated*; when
  upstream publishes, the fallback empties itself.

## Explicitly v2

- Accounts and sync across devices. v1 is `localStorage` on purpose.
