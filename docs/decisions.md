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

**Every manual check happened to dodge the exact input that broke something.**
Three separate times, closing out this session:

- The locale redirect (`/` → `/en`) never ran. Next 16 renamed
  `middleware.js` to `proxy.js` — a straight rename, read from this exact
  version's own bundled docs, not assumed — and the file has to live beside
  `app`, so a repo with `src/app` needs `src/proxy.ts`, not a root-level
  `middleware.ts` or even a root-level `proxy.ts`. Every check all session used
  an explicit `/en/...` path, so the one request that actually needed the
  redirect was never made until a real browser hit `/`.
- Every pack name with a space 404'd, since the route was created.
  `generateStaticParams` registered `encodeURIComponent(pack.pack)` — for
  "Pulsing Aura" the literal string `"Pulsing%20Aura"`, percent sign and all —
  against `dynamicParams: false`, which matches the already-*decoded* segment.
  Every single-word pack name (Pikachu, Charizard, Solgaleo...) encodes to
  itself, so this was invisible through every screenshot this session, by pure
  coincidence of which packs got clicked.
- A deck spanning 4+ Pokémon elements crashed the editor outright:
  `ptcgp-deckcode` throws on a 4th energy type, a real game rule nothing
  enforced — inference had no cap, the manual toggle let all 10 light up, the
  decklist parser would read a fourth token off an `Energy:` line.

None of these were found by reasoning about the code — each one came from
actually clicking through a real deck, in a real browser, after the fact. The
lesson isn't "write more unit tests" (two of the three now have one); it's
that manual passes need to deliberately hit the input nobody happened to try —
a bare `/`, a pack with a space in its name, a deck that isn't mono-type.

**A `<button>` without `appearance-none` keeps its native chrome even with a
custom background.** Tailwind's preflight leaves `appearance: button` on
purpose — it's what lets iOS Safari style a button's radius at all — but on
macOS the browser still paints its own pushable capsule underneath, smaller
than the element's own box. A `hover:bg-*` meant to fill an element edge to
edge instead left dark margins around a visibly inset shape. Invisible on
`Button`'s small hit areas (an icon-sized button), obvious on the export
menu's wide, full-row items — same bug, just easier to see at that size.
Fixed by adding `appearance-none` to both `Pressable` and `Button`'s base
classes, confirmed with `getComputedStyle(el).webkitAppearance === 'none'`,
not just by eyeballing a screenshot at normal resolution.

**The first deploy attempt failed generating static pages, and it wasn't the
code.** Vercel's build machine reported "2 cores, 8 GB" but Next used a
single worker for all 7,872 static pages (locally, 7 workers finish the same
in 26s) — seven times slower, and it died with a generic `fetch failed`
partway through. Reproduced locally with `next build` on the full page count
to rule out a bug in the pages themselves — clean run, same page count, no
error — before concluding this was Vercel's build infra having a transient
network hiccup, not something to chase in the codebase. The retry succeeded
outright, generating everything in 2.7 minutes. Preview deploy is live at
`codentides-projects/pullwise`; promoting to production is still pending a
decision on `NEXT_PUBLIC_SITE_URL` (`sitemap.ts` defaults to a domain,
`pullwise.app`, that doesn't exist).

**Versioning got a real policy instead of staying frozen at `0.1.0` for 54
commits.** The footer already shows `package.json#version` live, so an unread
version number was a lie sitting in the UI, not just internal bookkeeping.
Chose a `pre-push` git hook over a `pre-commit` one deliberately: gating every
local commit punishes the normal back-and-forth of getting something working,
where gating the push — the moment something actually reaches the shared
branch — is the point that should carry a real version number. The hook
distinguishes "touches shippable code" from "docs and CI only" by an
allow-list of paths (`src/`, `scripts/`, `public/`, `package.json`,
config files) rather than trying to enumerate every non-code extension, since
missing one silently defeats the check. Not hooked: `docs/decisions.md`
itself — "was this worth documenting" is a judgement call a script can't make,
and a mechanical gate over it would only produce hollow entries. See
`CLAUDE.md`'s Versioning and Judgement calls sections.

## Where it stands

55 commits · 59 tests · `pnpm verify` runs lint, typecheck and tests before
every build, and CI (`.github/workflows/ci.yml`) now runs that plus a real
`pnpm build:only` on every push and PR — the three bugs logged above only
ever showed up in an actual build or a real click-through, never in lint,
types or the unit tests. 3,879 cards through B4a, 511 still unclassified (B3
onwards, unchanged). Public on GitHub: `github.com/codentide/pullwise`, MIT
licensed, README rewritten in English, CONTRIBUTING.md added. 8 open issues,
2 closed (#1 the deck-code QR, #5 the README rewrite) — the export-menu work
above also covers much of #2's spirit (a way to get a deck out of the app),
though #2 itself is specifically about shareable URLs and stays open.

The whole product shares one footer now (`AppFooter`), the same way it shares
one header — brand mark, version read from `package.json`, a link to the
repo. Building it surfaced the same bug twice: a `border-t` (then the whole
element) needs its own full-width layer, separate from the `mx-auto
max-w-[1180px]` that centres its content — `mx-auto` on a flex item (this sits
directly in the page's `flex flex-col` shell) shrinks the box to its content
and centres it with auto margins instead of filling the row first.
`AppHeader` never hit this because its `mx-auto` lives on a plain block
*inside* the flex item, not on the flex item itself.

Deck export now has two shapes behind one "Export" popover instead of two
buttons competing for the same header row: the in-game QR code (issue #1),
and `toDecklist` — the inverse of the existing decklist parser, plain text a
player can paste into Limitless. The popover itself is hand-rolled, not
Radix, matching the brand rule that reserves Radix for Select/Dialog/
Checkbox.

**Nobody has used the app by hand** was still true when this line was first
written, and stopped being fully true two sessions ago — three real bugs were
found that way, and this session's Vercel build failure adds a fourth kind of
gap manual Playwright checks can't catch (build infra, not app code).
Everything else is still Playwright. `CardTile.tsx` had 7 commits of visual
iteration; the deck-code dialog added 7 more on top. Issue #4 tracks finishing
the job by hand. Issue #3, deploying it, has a working preview; only the
production promotion and the domain decision remain.

**Issue numbers got a stable, human-speakable code (`PWS-0NN`) instead of a
bare `#N`.** Chose "the issue's own number, zero-padded" over a separate
sequential counter for one reason: a second counter is one more piece of
state that can drift from GitHub's own, and the failure mode (two issues
claiming the same code) is worse than the problem it would solve. The number
literally cannot be known before GitHub creates the issue, so `create-issue`
creates first and renames as an immediate second step — not a design
compromise, the only order that works.

**`create-issue` and `tackle-issue` became skills, not something re-derived
each session.** The issue template (`create-issue/ISSUE_TEMPLATE.md`) leans
directly on the shape that already worked in this repo — the QR feature's own
plan had a "Why", a scoped "What", an explicit "Out of scope", and a
verification section, and every one of those turned out to matter. "Out of
scope" specifically is the section an agent benefits from most: without it,
scope creep is the default outcome of an AI implementing a loosely-bounded
ask, not an occasional risk. `tackle-issue` is built around the same
discipline this session kept re-learning the hard way: read the issue, but
verify the codebase still matches what it assumes, ask what's genuinely
unclear before implementing, and check by hand once something is visual.

**`vercel link`'s GitHub integration was deploying every push to `main` to
production, silently, since the moment it was connected.** The plan had been
"preview now, decide on the domain, then promote to production deliberately"
— but connecting the repo enables auto-deploy by default, and Vercel's
Production Branch defaults to whatever the GitHub default branch is (`main`
here). Every commit pushed after `vercel link` — the export feature, the
versioning policy, the README rewrite, PWS-011 — went live on
`https://pullwise-deck.vercel.app` the moment it landed, confirmed by
`vercel ls` showing `Production` on all but one deployment (the one manual
preview run). Caught only because the user asked for a `develop` branch "for
the peace of mind that a push doesn't auto-deploy" — a request that,
investigated, turned out to already be a real gap, not a hypothetical one.

Fixed by splitting the branches rather than touching Vercel's project
settings: `main` stays wired as Production (GitHub's default branch, so no
Vercel reconfiguration needed), `develop` is where routine work happens and
only ever gets a Preview URL, and `main` is merged into deliberately. See
`CLAUDE.md`'s Branches section.

## Post-audit hardening (PWS-012)

An Opus architecture audit against Next 16/React 19 best practices, run
because the goal is real public reach and the foundations hadn't been
checked since the Vite→Next migration. It found 2 critical and 10 important
gaps, plus 9 nice-to-have items, all with file/line evidence verified
against a real build. Fixed in one batch, 10 self-contained packages built
in parallel by Sonnet subagents in isolated worktrees, merged sequentially.

**`AppHeader` stopped shipping the full card catalogue to every public
page's client bundle, and `DataMenu` no longer renders on `(site)` pages.**
`AppHeader` imported `meta` (just a card count and a set name) from
`gameData.ts`, whose module-level side effects build lookup tables from the
entire 717KB `cards.json` — so every one of the ~7,860 statically-generated
card/set/pack pages shipped that whole dataset to the browser just to
render two numbers in the header. Split into a Server Component `AppHeader`
plus a small client `NavTabs` (the only part that actually needs
`usePathname`), reading the count from a new slim `src/lib/meta.ts`
instead. Measured drop: ~1.25MB → ~530KB raw first-load JS on the public
routes. `DataMenu` (Export/Import, which mutates the whole app's
`localStorage` state) also stopped rendering on `(site)` pages in the same
change — it never made sense on a page reached from a search engine, only
inside the deck-building tool, so `AppHeader` gained a `tools` prop the two
route groups set differently.

**The 3 detail pages switched `dynamicParams` from `false` to `true`,
without reducing `generateStaticParams`'s coverage.** Previously an
unmatched card/set/pack id 404'd until the next full rebuild, and a single
bad param during static generation could fail the *entire* build — the
same all-or-nothing risk that caused a real deploy failure earlier in this
project's history. `generateStaticParams` still prerenders every currently
known id exactly as before; the only change is that a param which becomes
valid between builds (a card from a set that ships later) now renders
on-demand instead of 404ing, and each page's own `notFound()` still
rejects genuinely invalid ids. Pure risk reduction, no change in what's
indexed today.

**Adopted `next/image` for card and pack art, with `images.unoptimized:
true` — deliberately not a full fix.** All three image components moved
off raw `<img>` tags for CLS prevention and a single consistent
loading/priority API, which the `next.config.ts` `images.remotePatterns`
entry had been configured for but nothing ever used. The optimizer itself
stays off on purpose: at 3,879 cards × 2 locales, routing every thumbnail
through Vercel's on-demand image optimization would exhaust the Hobby
plan's quota almost immediately. That means the real byte-size problem this
was meant to also address — an 88px-displayed grid thumbnail still
downloading its full 367×512 original — is **not** fixed by this change;
real thumbnail-size reduction (pre-generated variants, or a different CDN
strategy) stays open for later.
