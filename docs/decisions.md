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

**Routes, not tab state.** The three app views were `useState` tabs inherited
from the original Vite SPA — the Next migration moved the files but never gave
them URLs. `/decks`, `/decks/[id]`, `/packs`, `/cards` are real routes now,
under a new `(app)` group that mirrors `(site)`: one shell, one header
(`src/components/AppHeader.tsx`), `noindex` on the whole group since every page
in it renders from the reader's own `localStorage` and a crawler sees an empty
shell. `/decks/[id]` for an id the browser has never seen is not a 404 — deck
ids are local to the device that made them, so someone else's link legitimately
does not resolve, and `useHydrated` (`src/hooks/`) is what tells "not loaded
yet" apart from "no such deck" so it does not flash *not found* on every load.

**The repo is public**, pushed to `github.com/codentide/pullwise` after 36
commits with no remote at all. Its label taxonomy — `bug` / `feature` / `chore`
/ `refactor` / `docs` / `tech debt` / `marketing` / `ui/ux` / `priority:*` /
`blocked` / `needs clarification` / `on-demand` / `external` — is copied
verbatim from the user's `zitta` repo, on request, so both read the same way.
`on-demand` (*brief ready, waiting on an external trigger*) fits the three
upstream-data issues exactly: no code to write, just a wait `sync-data.mjs`
already resolves on its own the moment upstream publishes. **GitHub Issues are
now the live backlog** — `BACKLOG.md` is an index into them, not a duplicate;
keeping both in full would just be two lists drifting apart.

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

## The deck-code QR (issue #1)

Closes the loop the whole app exists to close: build the deck here, scan a
code, the game imports it — confirmed on ptcgpocket.gg that this still works
with cards missing, turning the gap into an in-game shopping list. The format
was already solved and MIT (`ptcgp-deckcode`, wraps `qrcode`); the one real gap
was `deckBuilderNr`, the internal id each card needs, which nothing in this
repo had ever stored.

Verified before writing any code, not assumed: `image` is present on
3,879/3,879 cards in the upstream `cards.min.json`, and the regex the library
uses internally to derive `deckBuilderNr` from it — read from the library's own
source, not its docs — resolves for all 3,879, zero misses. Reimplemented in
`sync-data.mjs` (eight lines) rather than depending on the library at sync
time. One thing that only turned up once, from the library's own type
definitions: the game's Energy Zone offers just 8 basic types — `dragon` and
`colorless` are real card elements but never a zone option, since a Dragon
attack's cost is paid in other basics and Colorless accepts any of them.
`buildDeckCode` filters to those 8 before encoding, so a Dragon-heavy deck's
inference collapses to an honest "pick an energy type" instead of silently
dropping the type and encoding whatever else was inferred alongside it.

Tested by decoding the library's own output, not by trusting it: a synthetic
deck round-trips through `parseDeckCode`, and by hand, a real 20-card deck's
generated code decoded back to the exact card names and copy counts that went
in — checked against `cards.json` after the fact.

**Two real bugs found by finally testing against a pasted Limitless export**,
neither caught by any test until then because every existing test used an
uppercase-only set code:

- 13 of the 23 sets carry a lowercase-suffixed code (`B1a`, `A2b`...). The
  decklist parser force-uppercased every set code before lookup, so `B1a`
  became `B1A`, matched nothing, and silently fell back to resolving by
  name — which returns a real card, just not necessarily the right printing
  (different set, different packs). Fixed with a regression test (`292ee0bf`).
- `Energy: Lightning`, the one line in a real export that names the deck's own
  energy zone, was being discarded on purpose — `SKIP_LINE` swallowed it along
  with genuine section headers. Now parsed into `ParsedDeck.energy`.

**The dialog itself took five rounds of visual iteration in one sitting**
(`0cdd40e4` through `8f164763`) — a chip box, then a ring, then a glow, landing
on plain opacity for the energy toggles earlier in the session, and separately
for the QR dialog: deck name as title, then a fixed title with the name
dropped, headerExtra added for the count and energy, the code box moved from a
full-width row back into the left column and finally pinned to the bottom of
it. Screenshotting all three states (ready / incomplete / no-energy) before
each commit — not just the one being changed — is now the working rule; one
commit went out having only checked the state actually being edited.

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

42 commits · 55 tests · `pnpm verify` runs lint, typecheck and tests before
every build. 3,879 cards through B4a, 511 still unclassified (B3 onwards,
re-checked against both live sources before writing this, unchanged). Public
on GitHub: `github.com/codentide/pullwise`, 9 open issues, 1 closed (#1, the
deck-code QR — the item this log used to list as "next up").

**Nobody has used the app by hand.** Everything has been verified through
Playwright. `CardTile.tsx` had 7 commits of visual iteration before this; the
deck-code dialog just added 5 more — screenshots are driving this UI more than
use is, which remains the main risk. Issue #4 tracks it.
