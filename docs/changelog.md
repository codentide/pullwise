# Changelog

[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) shape, one entry per
bump. See `CLAUDE.md`'s Versioning section for what earns which bump.
Versions before this file existed aren't reconstructed — `docs/decisions.md`
has that history.

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
