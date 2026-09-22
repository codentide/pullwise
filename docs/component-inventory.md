# Component inventory

What the app actually uses today, derived from the code rather than imagined.
This is the filter for reading any design manual: a complete system will propose
far more than this, and only what maps onto something here earns its way in.

Measured across 22 files in `src/components/` (36 exported components/helpers)
and 170 `className` usages.

## Base components the code was already asking for

This table is a historical record, not a to-do list: it is the repetition that
justified extracting each row below into the component named in it. Every row
has since been built — none of this is raw utility duplication left in the
codebase today.

| Repeated pattern | Became | Notes |
| --- | --- | --- |
| A raised box with a border and padding | `Panel` (`Panel.tsx`) | `pad='sm' \| 'md'` is the only thing that varied |
| A 1px-gap list over a line-coloured ground | `HairlineList` + `HairlineRow` (`Panel.tsx`) | the gap over `bg-line` is what draws the separators, not per-row borders |
| A dashed placeholder box | `EmptyState` (`Panel.tsx`) | |
| Three ad-hoc badge/marker class strings (`estimated`, rarity tag, copy counter) | `Badge` (`Indicators.tsx`) | named by tone (`neutral`/`accent`/`have`/`miss`/`warn`), not by which caller it was |
| The two button shapes used across the app | `Button` + `ButtonLink` (`Button.tsx`) | 6 variants, one shared `BASE` string |
| A native `<select>` restyled three separate times | `Select` (`Select.tsx`) | now Radix-backed |
| `window.confirm` | `Dialog` + `ConfirmDialog` (`Dialog.tsx`) | |

## The closed set

The goal is a closed vocabulary: an agent writing a feature picks from this list
or extends it, and cannot reach for a raw element. Native tags are banned outside
`src/components/` by lint, so "just use a `<button>`" stops being available.

### Built

| Component | File | Role |
| --- | --- | --- |
| `Button`, `ButtonLink` | `Button.tsx` | 6 variants (`primary`, `quiet`, `ghost`, `danger`, `dashed`, `link`); `ButtonLink` is the same shapes as an anchor |
| `Pressable` | `Pressable.tsx` | behaviour with no look, for elements that are clickable but not buttons in the design sense (a card, a tile) |
| `Icon` | `Icon.tsx` | Lucide, mapped by role, not by shape |
| `Panel`, `HairlineList`, `HairlineRow`, `EmptyState` | `Panel.tsx` | raised surface, separated list, dashed placeholder |
| `Heading` | `Heading.tsx` | `title` · `page` · `section` · `sub` · `gameName` · `eyebrow` |
| `Dialog`, `ConfirmDialog` | `Dialog.tsx` | Radix-backed; `ConfirmDialog` is the yes/no shape built on `Dialog` |
| `Select` | `Select.tsx` | Radix-backed; trades the native OS picker for full visual control and icon-in-option |
| `TextInput`, `SearchField`, `Textarea`, `Checkbox`, `HiddenFileInput` | `Field.tsx` | `Checkbox` is Radix-backed; the rest are native elements with the shared look |
| `Badge`, `Stat`, `Bar`, `Chip` | `Indicators.tsx` | read-only indicators (`Badge`, `Stat`, `Bar`) and the one interactive toggle (`Chip`) |
| `Notice`, `NoticeList` | `Notice.tsx` | tinted, iconed message with optional trailing action |
| `Hint` | `Hint.tsx` | small hover/tap "why" panel attached to a label — deliberately not a Radix primitive |

### Domain components (product-specific, not part of the generic set)

TCG domain:

`CardImage` · `CardTile`, `CopyLights`, `DeckCardTile` (all in `CardTile.tsx`) ·
`EnergyIcon` (10 hand-drawn energy discs) · `PackImage` · `PackRanking` ·
`RarityPips` (`Rarity.tsx`)

App chrome (shared by 2+ routes, per the promotion rule in `CLAUDE.md`):

`AppHeader` · `AppFooter` · `DataMenu` · `Wordmark`, `Mark` (`Wordmark.tsx`) ·
`ThemeToggle`, `ThemeScript` (`ThemeToggle.tsx`)

`CopyLights` is the current name of what this document used to call `OwnedPill`
— renamed when its job stopped being a single pill and became a row of per-copy
indicators.

### No longer in `src/components/`

`StaticCardImage`, `CardFilters`, `CardGridLinks` and `SiteChrome` — all listed
here in an earlier version of this document — have since moved to the
route-owned `_components/` folder of the single route that uses each of them
(`cards/_components/CardFilters.tsx`; `(site)/_components/` for the other
three), per the rule in `CLAUDE.md`: a component lives with its route until a
second route needs it. None of the four is shared, so none of them belongs in
this inventory anymore.

### The trade-off accepted

A native `<select>` opens the operating system picker on mobile, which is better
than any custom one and is where this game is played. Replacing it with `Select`
is a deliberate cost, paid for consistency and full visual control.

## What can become a hard rule, and what cannot

The distinction matters more than the manual's contents: a rule that cannot be
checked is a suggestion, and this codebase is written largely by agents.

**Enforced today** (`eslint.config.js`'s `no-restricted-syntax`, plus
`test/contrast.test.ts`)
- No raw hex or `rgb()`/`hsl()` literal — colour only through tokens
- Spacing only on the scale — `1, 2, 3, 4, 6, 12, 24` (4/8/12/16/24/48/96px);
  `gap-px` is exempt, it draws hairlines rather than spacing
- No `rounded-none` — nothing in the product has a hard corner
- Contrast ratio of every token, in both themes

**Not yet enforced** (true today only because nobody has broken it, not
because a build step would catch it)
- Radii actually staying on the three defined steps (`rounded-chip` /
  `-control` / `-surface`) — only the *absence* of `rounded-none` is checked,
  not an arbitrary bracketed radius
- Type staying on the six defined sizes (`text-hero` / `-title` / `-section` /
  `-body` / `-meta` / `-label`)
- Interactive targets at or above a minimum height
- No duplicated utility combination above N occurrences — the rule that would
  flag a pattern before someone has to notice it by eye, the way the table
  above was noticed

**Documentable only** (goes in prose, gets reviewed by a human)
- *When* to use each component, versus what it looks like
- Density: which surfaces are dense (catalogue) and which breathe (public pages)
- Hierarchy between the three figures in the ranking
- Tone of empty states and error messages

## Note on where the styles live

There are already two sources of truth and a third would be one too many:

- `src/index.css` — the tokens. Executable, and verified by a test that fails the
  build. This stays the source of truth for any value.
- `CLAUDE.md` — the rules that need judgement.

A styles document should hold **what the other two cannot**: component usage,
when to reach for which, and the reasoning behind the system. It must not restate
token values — the moment a hex appears in two files, one of them is already
wrong.
