# Changelog

[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) shape, one entry per
bump. See `CLAUDE.md`'s Versioning section for what earns which bump.
Versions before this file existed aren't reconstructed — `docs/decisions.md`
has that history.

## [0.6.0] - 2026-09-22

### Changed

- Energy-type icons across the whole app (the hover preview, the deck
  editor's Energy Zone, the card filters, the QR dialog) are now the real
  printed TCG symbols — full colour, pulled once into `public/energy/` —
  instead of hand-drawn glyphs. Three redrawn passes never read as more
  than an approximation once seen next to the real thing.
- The Energy Zone's unselected types are grayscale as well as dimmed now
  that the disc is real, full-colour art; a dimmed colour icon still read
  as "on" at a glance, which plain opacity never had to solve before.
- The hover preview's layout: the type badge moved to the name row (left of
  the name), weakness moved to its own line pinned to the bottom of the
  panel (there's room above it for `PWS-011`'s HP/attacks later), and the
  set logo's plain-text fallback — for the sets TCGdex has no logo for —
  now matches the panel's actual type scale instead of inheriting a much
  larger default.

## [0.5.1] - 2026-09-22

### Changed

- Softer visual treatment for the missing-card hover preview: `rounded-surface`
  instead of `rounded-control` (it's a real panel, not a small control), a
  lighter border, more padding, and its secondary facts (set, type, weakness)
  joined into one line instead of stacked — the same composition
  `card/[id]/page.tsx`'s own header already uses for the same fields.

## [0.5.0] - 2026-09-22

### Added

- The missing-card hover preview (0.4.1) now shows what `Card` already
  carries, not just art: rarity, set, type, weakness and evolves-from —
  the same facts and the same `cardPage` translations the full card page
  already shows, laid out compact (small art on the left, facts on the
  right) for a quick glance rather than a read.

### Fixed

- 0.4.1's tooltip floated directly above whichever chip triggered it,
  hand-positioned by measuring the chip — which for a chip anywhere but
  the very top of the page could climb high enough to cover the pack's
  own odds figures above it, the one thing it could least afford to hide.
  Replaced the hand-rolled positioning with `@floating-ui/react-dom` —
  already installed at zero extra weight, since it's the same engine
  behind `@radix-ui/react-select`'s own popper — and defaulted to opening
  below the chip rather than above: the library's `flip`/`shift` keep the
  panel inside the viewport, but only a human call on which direction is
  *usually* clear of other content actually avoids the odds figures in
  practice. See `docs/decisions.md` for why, and for a second bug this
  surfaced (the entrance animation and the library's own positioning both
  wanted to animate `transform`, fixed by keeping positioning on
  `top`/`left` instead).

## [0.4.1] - 2026-09-22

### Added

- Each missing-card chip from `PWS-013` now shows the card's own art on
  hover (desktop) or tap (touch) — a quick visual check before opening the
  pack page itself. Reuses `CardImage`; no new data or sync work needed,
  `Card` already carries everything `imageUrl()` needs.

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
