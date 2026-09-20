# Decision log

What the commit history cannot hold: why the alternatives were rejected, what
the research found, and which bugs keep recurring in this codebase.

Read `CLAUDE.md` first for the rules. This is the reasoning behind them.

## The product

**Pullwise** — `~/code/personal/pullwise`. Which pack to open in Pokémon TCG
Pocket to finish the deck you are building.

Four trackers already exist (PTCGPocket.gg, PTCGP Tracker, Untapped, PTCGP Hub)
and none closes the loop: they show pull-rate tables and leave the arithmetic to
you. The reason nobody closes it is the loading cost — knowing what you lack
looks like it requires knowing what you own, which is 3,879 decisions. It cannot
be automated: **TPC and DeNA expose no account API**, and the trackers that claim
to "sync" use OCR of screenshots.

The inversion the user proposed, which the whole product hangs on: **the unit of
work is the deck, not the collection.** A deck is 20 cards.

## Data sources, and what each is good for

| Source | Use | Coverage |
| --- | --- | --- |
| [`flibustier/pokemon-tcg-pocket-database`](https://github.com/flibustier/pokemon-tcg-pocket-database) (MIT) | Cards, sets, pull rates, pack membership | 3,879 cards through B4a |
| Limitless CDN | Card art, `{SET}/{SET}_{NNN}_EN.webp` | Complete, **English only** |
| [Bulbagarden Archives](https://archives.bulbagarden.net/wiki/Category:Pok%C3%A9mon_TCG_Pocket_packs) | Booster artwork | All 28 packs |
| TCGdex | Type/stage for cards the primary set lacks | B2 and B2a only |

Rejected, with reasons measured rather than assumed:

- **Spanish card art** (TCGdex): 44% of cards, and the gaps are every 2026 set.
  A deck would render half in each language. `imageUrl()` takes a locale and
  ignores it; when coverage lands this becomes a data change.
- **TCGdex set logos**: 10 of 21 sets. Same shape of problem.
- **`cards.extra.json`** as the primary card list: missing ~1,300 cards. It is
  merged over `cards.min.json` instead.
- **`chase-mew/pokemon-tcg-pocket-cards`** for deck codes: same logic as the MIT
  original but its port is **AGPL-3.0**, which for a web app would force all of
  Pullwise open. Use [`Nirostar/ptcgp-deck-qr`](https://github.com/Nirostar/ptcgp-deck-qr) (MIT) instead.

Two upstream defects worth remembering: `health` and `retreatCost` were constants
(50 and 1) across all 2,211 cards carrying them — placeholders dressed as data,
live on thousands of indexable pages before a test caught it. And `sets.json`
contradicts `cards.json` about B4a's packs; the cards are right.

## Architecture decisions

**Vite → Next 16.** Made for SEO once the goal became public reach. The public
half is ~7,900 statically generated pages per locale, which exist to be found in
search; the app half is client-only and its state never leaves the browser. The
domain (`src/lib/`) imports no framework, which is what made the migration cost
825 lines less than it would have.

**No login, `localStorage` only.** v1 on purpose.

**Radix for Select, Dialog and Checkbox only.** The user wanted no native
elements for full visual control; the trade-off accepted is that a native
`<select>` opens the OS picker on mobile, which is better than any custom one.
Everything else is hand-written — the app has 8 runtime dependencies.

**A closed component set.** `react/forbid-elements` bans raw interactive tags and
headings outside `src/components/`. An agent that wants a button gets `Button`;
if it cannot do the job, the answer is to extend `Button`. This rule has stopped
the model four times in one session — more often than it has stopped a human.

**Brand system with two overrides**, both recorded in `CLAUDE.md`: `--ink-low`
ships lighter than specified (the specified value measured 4.08:1) and the radius
scale has no zero (the user removed hard corners from the product).

**The brand system's source lives outside this repo**, which cost a day: the app
was built to it while only the brief we sent — `docs/design-brief.md` — was
versioned, so nothing here said what the logo was and one got invented. It is a
Claude Design project, readable through the DesignSync MCP:

    project 8a3b1d38-43ce-4710-abce-633464507b13
    file    "Pullwise Brand System.dc.html"     (§03 is the wordmark and mark)

Its palette was checked against `src/index.css` hex by hex and matches, the two
overrides above excepted. Anything taken from it belongs in a token or a
component, never copied into a call site.

## The bug patterns this codebase produces

Worth knowing because they recur, and because each one now has a test:

**A base component's Tailwind class silently beating the caller's.** Tailwind
resolves two utilities for the same property by their order in the generated
stylesheet, not by their order in the class attribute — so `className` on a
component that already sets that property is a coin flip. It has happened three
times: `CardImage` pinning the panel radius on a 48px thumbnail, `Notice` pinning
the padding under a card image, and `TextInput` pinning `text-meta` under a
caller's `text-title`, which shipped a 13px deck title that read as 32px in the
source. Each time the fix is the same: the property becomes a variant on the
component, never an override at the call site.

**Contrast that looks fine.** Three separate times: the darkness energy icon at
2.6:1 (invisible), `--ink-low` at 4.08:1, and all three semantic colours in the
light theme (amber at 1.84:1). Every one shipped looking plausible. `contrast.test.ts`
now checks both themes against all three surfaces.

**Data that is not data.** Constants disguised as fields, as above. `realData.test.ts`
fails any field that never varies across 100+ cards.

**Hydration from `localStorage`.** The store rendered empty on the server and
populated in the browser. Only reproduces with saved data, so it never appears in
a clean test. The fix is `useSyncExternalStore`'s third argument.

**Verification with the wrong instrument.** Measured re-render cost with a
double-`requestAnimationFrame` whose own floor was 33ms; compared colour
distinctness with WCAG contrast, which measures luminance, not hue. Both produced
confident, wrong conclusions. Check what the instrument can actually resolve.

## Where it stands

19 commits · 41 tests · `pnpm verify` runs lint, typecheck and tests before every
build. 3,879 cards through B4a, 511 still unclassified (B3 onwards, unpublished
anywhere), 28 packs with real artwork.

**Nobody has used the app by hand.** Everything has been verified through
Playwright. `CardTile.tsx` alone has 7 commits of visual iteration driven by
screenshots rather than use — that is the main risk right now.

Next up is in `BACKLOG.md`: the in-game deck code (researched, MIT, feasible),
then shareable deck URLs. The public pages have not been looked at since the
brand system landed.
