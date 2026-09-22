# Changelog

[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) shape, one entry per
bump. See `CLAUDE.md`'s Versioning section for what earns which bump.
Versions before this file existed aren't reconstructed — `docs/decisions.md`
has that history.

## [0.4.0] - 2026-09-22

### Added

- The pack recommendation (`/packs` and the deck editor's aside) now names
  the specific missing cards a pack can yield, not just how many. Hidden
  behind a collapsed-by-default "Show cards" toggle on the winner and every
  "other pack" row — nothing new is visible until asked for, matching the
  app's rule against pushing information at the user unprompted (`PWS-013`).

## [0.3.1] - 2026-09-21

### Fixed

- `NEXT_PUBLIC_SITE_URL`'s fallback pointed at `pullwise.app`, a domain that
  was never actually registered — every canonical URL, hreflang tag, and
  OG image would have shipped a dead domain. Corrected to the real Vercel
  deployment, `pullwise-deck.vercel.app`.

## [0.3.0] - 2026-09-21

Post-audit hardening batch (PWS-012) — an architecture audit against Next 16/
React 19 best practices, fixed in one pass. Full rationale in
`docs/decisions.md`.

### Added

- SEO: `metadataBase`, canonical URLs, and absolute hreflang (with
  `x-default`) on every public page; Open Graph images and JSON-LD structured
  data on card/set/pack pages.
- A branded `global-not-found`/`global-error` fallback (Next 16), instead of
  the framework's bare, unstyled default.
- Test coverage for 5 previously-untested `src/lib/` modules, including the
  core "unknown is assumed owned" invariant and the data that feeds every
  indexed page's odds text.
- A bundle-size budget in CI for the public `(site)` routes.

### Changed

- `AppHeader` no longer ships the full 3,879-card dataset to every public
  page just to render a counter — cut public-route first-load JS from
  ~1.25MB to ~530KB raw.
- `/decks`, `/decks/[id]`'s siblings, `/packs` and `/cards` now prerender as
  static instead of forcing per-request dynamic rendering.
- Card/set/pack detail pages tolerate an id that becomes valid between
  builds instead of 404ing until the next full deploy.
- Card and pack art now renders through `next/image` (unoptimized, by
  design — see `docs/decisions.md`) instead of raw `<img>` tags.
- Every screen that reads saved decks/knowledge from `localStorage` now
  waits for hydration before showing an empty/disabled state, so a
  returning visitor with real data never sees a false empty flash.

### Fixed

- Energy, rarity and accent colour tokens now clear their contrast
  thresholds in light mode too, not only dark — the worst offender measured
  1.42:1.
- `Chip` had the same native-button-chrome bug already fixed elsewhere;
  `Dialog` gained a visible close button.
- The card detail page's single-accent rule, restored to one use.

## [0.2.0] - 2026-09-20

### Added

- Export a deck as a plain-text list (`toDecklist`, Limitless-compatible),
  alongside the existing in-game QR code — both now live behind a single
  "Export" popover instead of two competing buttons.
- A pre-push hook and CI workflow so shipping code without a version bump,
  or with a broken build, gets caught before it lands.

### Fixed

- macOS painted its own native button chrome under `hover:bg-*` fills,
  leaving dark margins around a hover state instead of filling the row
  (`Pressable`, `Button`).

## [0.1.0] - 2026-09-19

Initial scaffold: pack-probability math, deck builder, i18n routes, brand
system, the in-game deck-code QR (issue #1). Never formally versioned at the
time — recorded here as the starting point.
