# Pullwise

Which pack to open in Pokémon TCG Pocket to finish the deck you are building.

Most of this codebase is written by agents. That shapes every convention below:
**a rule that does not break the build is a suggestion, and suggestions drift.**
So the rules split in two — the ones a machine can check are checked, and only
what genuinely needs judgement lives here as prose.

Tracked work lives in GitHub Issues, each coded `PWS-0NN` (that number is
always the issue's own, zero-padded — never a separate counter). Use the
`create-issue` and `tackle-issue` skills for both ends of that: filing a new
one and picking one up. Don't hand-roll either process — they encode how an
issue should be shaped and how it should be investigated before anything
gets implemented.

## Enforced (do not restate these in review — the build catches them)

`pnpm build` runs `pnpm verify` first: lint, typecheck and tests. If it is green,
these hold:

| Rule | Where it lives |
| --- | --- |
| `src/lib/` imports no React, Next or i18n | `eslint.config.js` + `test/architecture.test.ts` |
| A `_components/` file is only imported from its own route | `test/architecture.test.ts` |
| No raw hex or `rgb()` in components — tokens only | `eslint.config.js` |
| No dataset field is a constant disguised as data | `test/realData.test.ts` |
| `src/data/` is only produced by `sync-data.mjs` | `test/architecture.test.ts` |
| Style: neostandard (no semicolons, single quotes, 2 spaces) | `eslint.config.js` |

## Versioning

`package.json#version` is real, not decoration — the footer shows it live
(`AppFooter.tsx`), so it's the one version number a user can actually see.
Semver, applied loosely pre-1.0:

- **patch** (`0.x.Y`) — a fix, a visual tweak, no new capability.
- **minor** (`0.X.0`) — a new user-facing feature, or a change big enough that
  "what changed" is worth a reader's attention.
- **1.0.0** is reserved for the first real production deploy (issue #3) — the
  milestone that means someone other than the developer can use this.

Whoever ships a change to `src/`, `scripts/`, `public/`, or bumps a dependency
decides the bump and applies it in the same push — an agent included. A
`pre-push` hook (`.githooks/pre-push`, wired up by the `prepare` script)
blocks a push that touches those paths without a version change; a push that
only touches docs or CI config is exempt. `git push --no-verify` skips it for
the rare case that's genuinely wrong.

`CHANGELOG.md` gets one entry per bump, [Keep a Changelog](https://keepachangelog.com/) shaped.

## Structure

Each route owns its files. A component lives in the `_components/` folder of its
route until a **second** route needs it; only then does it move up to
`src/components/`. Do not pre-emptively promote anything.

```
src/app/[locale]/(app)/      the tool — one route per view, client, noindex
src/app/[locale]/(site)/     public static pages (server, indexable)
src/components/              shared by 2+ routes — empty is a valid state
src/hooks/                   React's window onto the domain, shared the same way
src/lib/                     the domain: no framework, runs in Node tests
src/data/                    generated, never hand-edited
```

The three views are **routes, not tab state**: `/decks`, `/decks/[id]`, `/packs`,
`/cards`. Each `page.tsx` stays a server component so it can carry its own
metadata, and renders the client view underneath.

Imports: `@/` across folders, `./` within one, always with the `.ts`/`.tsx`
extension — the tests run on plain Node, which does not resolve bare specifiers.

## The brand system

The visual layer implements the **Pullwise Brand System v1.0**. Its rules are not
preferences:

- **One accent, once per screen.** Flare (`--color-accent`) is reserved for the
  recommendation, the primary action, and the figure that answers the question.
  If it appears twice on one screen, one of them is wrong.
- **Nothing has a hard corner.** The radius scale is 3px chips / 6px controls /
  10px surfaces, and **zero is not on it** — `rounded-none` is banned by lint.
  (The brand document specifies 0 for cards and panels; this system overrides
  it.) Structure still reads through 1px lines, and there are still **no shadows**.
- **Rarity is always doubly encoded** — colour *and* pips, never colour alone.
  The five grades are ours (`src/lib/rarity.ts` maps the game's eleven onto them,
  using the real pull rates); when the game adds a rarity, the table changes and
  the visual system does not.
- **Semantic colours are for deck validation only.** Never for a card's state:
  *unknown is not an error*. Unknown renders dashed and grey — a pause, not an
  alarm. Never red, never struck through, never counted.
- **UI icons come from Lucide**, mapped by role in `src/components/Icon.tsx` —
  call sites name the job ('pack', 'deck'), never the shape, so the source can
  change without the meaning moving. Energy symbols stay hand-drawn: no general
  icon set carries the ten TCG energies.
- **Set and pack names go in mono and in English** (`.game-name`), in both
  locales: that is how the player recognises them from the game.
- **Every estimate carries a `~`.** An exact number where there is chance is a
  design lie. Probability and estimated packs always appear together — either one
  alone misleads.
- **Three motion gestures, one curve** (`--ease-pw`), nothing over 400ms. No pack
  opening animations, no confetti, no rarity shimmer.

Dark is native; light is a translation, not an inversion. Both are verified by
`test/contrast.test.ts`.

## Judgement calls

**The app never asks for anything.** No streaks, no achievements, no progress bar
over 3,879 cards. A card nobody marked is *unknown*, never *missing*. This is the
one thing that distinguishes Pullwise from the four trackers that already exist,
and every feature has to survive the question: does this make the user feel they
owe the app work?

**Every number says what it is.** No figure appears without its unit and its
reading — `3.3% per pack`, never `3.3`. Tabular figures always. An estimate is
labelled as one and carries its uncertainty next to it (`125 typical · 240 with
bad luck`). Format numbers through `next-intl`, never `toFixed`: the decimal
separator differs per locale.

**A datum that cannot be verified is not published.** The upstream dataset shipped
`health: 50` and `retreatCost: 1` for all 2,211 cards carrying them — placeholders
wearing the clothes of data, and they were live on thousands of indexable pages
before a test caught it. When a new field arrives, check that it varies before
showing it.

**Language.** Code, comments and commits in English. Interface text in English and
neutral Spanish — no voseo, no regionalisms. Card, set and pack names stay in
English in both locales, because that is how the player sees them in the game.
Routes are English-only (`/card`, `/set`, `/pack`).

**Card art is English-only.** TCGdex publishes Spanish art for 11 of 23 sets, and
the gaps are every 2026 set — the ones people actually play. A deck would render
half in each language. `imageUrl()` takes a locale and ignores it on purpose; when
coverage catches up this becomes a data change.

**Tests are mandatory in `src/lib/`, optional elsewhere.** The maths is the only
part that can be wrong without anyone noticing on screen. Testing the domain means
testing against hand-checkable synthetic datasets, plus one consistency check
against theory — the Monte Carlo median is verified against the geometric
distribution's `⌈ln0.5 / ln(1−p)⌉`.

**No login, no accounts.** State lives in `localStorage`. That is v1 on purpose.

**A decision with real weight gets logged in `docs/decisions.md`, as part of
the same change** — not a chore for later, and not for everything. A naming
choice reverses easily and doesn't need it; a workaround for someone else's
bug, or a measured tradeoff between two real alternatives, is expensive to
reconstruct from git history alone once nobody remembers it. Unlike a version
bump, "was this worth documenting" is a judgement call, not a fact a hook can
check — a mechanical gate here would only produce hollow entries, so there
isn't one.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
