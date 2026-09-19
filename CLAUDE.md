# Pullwise

Which pack to open in Pokémon TCG Pocket to finish the deck you are building.

Most of this codebase is written by agents. That shapes every convention below:
**a rule that does not break the build is a suggestion, and suggestions drift.**
So the rules split in two — the ones a machine can check are checked, and only
what genuinely needs judgement lives here as prose.

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

## Structure

Each route owns its files. A component lives in the `_components/` folder of its
route until a **second** route needs it; only then does it move up to
`src/components/`. Do not pre-emptively promote anything.

```
src/app/[locale]/            the interactive app (client)
src/app/[locale]/(site)/     public static pages (server, indexable)
src/components/              shared by 2+ routes — empty is a valid state
src/lib/                     the domain: no framework, runs in Node tests
src/data/                    generated, never hand-edited
```

Imports: `@/` across folders, `./` within one, always with the `.ts`/`.tsx`
extension — the tests run on plain Node, which does not resolve bare specifiers.

## The brand system

The visual layer implements the **Pullwise Brand System v1.0**. Its rules are not
preferences:

- **One accent, once per screen.** Flare (`--color-accent`) is reserved for the
  recommendation, the primary action, and the figure that answers the question.
  If it appears twice on one screen, one of them is wrong.
- **Radii max out at 4px, and only on touch controls.** Cards, panels and tables
  sit at 0. Structure reads through 1px lines, never floating boxes. **No shadows.**
- **Rarity is always doubly encoded** — colour *and* pips, never colour alone.
  The five grades are ours (`src/lib/rarity.ts` maps the game's eleven onto them,
  using the real pull rates); when the game adds a rarity, the table changes and
  the visual system does not.
- **Semantic colours are for deck validation only.** Never for a card's state:
  *unknown is not an error*. Unknown renders dashed and grey — a pause, not an
  alarm. Never red, never struck through, never counted.
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
