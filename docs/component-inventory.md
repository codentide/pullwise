# Component inventory

What the app actually uses today, derived from the code rather than imagined.
This is the filter for reading any design manual: a complete system will propose
far more than this, and only what maps onto something here earns its way in.

Measured across 21 components and 177 `className` usages.

## Base components the code is already asking for

Each row is a utility combination that repeats verbatim. Repetition is the
evidence: these are components that exist conceptually but not in code.

| Repeats | Component | Current shape |
| --- | --- | --- |
| ×3 | **Button, primary** | `bg-accent px-3 py-1.5 rounded-sm text-xs font-medium text-accent-ink` |
| ×2 | **Button, quiet** | `border border-line-control px-2 py-1 rounded-sm text-2xs text-ink-dim` |
| ×4 | **Panel** | `bg-surface border border-line rounded-lg` + padding of 3 or 4 |
| ×2 | **Hairline list** | `bg-line border border-line rounded-lg flex flex-col gap-px` — the 1px gap over a line-coloured ground is what draws the separators |
| ×2 | **List row** | `bg-surface flex gap-3 px-3 py-2.5` |
| ×2 | **Empty state** | `border border-dashed border-line-strong rounded-lg px-6 py-12 text-center` |
| ×11 | **Heading scale** | `text-xl` (page) ×3, `text-base` (section) ×2, `text-sm font-medium` (subsection) ×6 |

Two more exist but are not yet duplicated, and should be watched rather than
extracted: **Select** (three instances share a `selectClass` constant already)
and **Badge** (the `estimated` marker, the rarity tag, the copy counter — three
visually different things doing the same job).

## Domain components that already exist

These are specific to the product and should not be replaced by generic
equivalents from a manual:

`CardImage` · `StaticCardImage` · `CardTile` · `DeckCardTile` · `OwnedPill` ·
`EnergyIcon` (10 energy discs, hand-drawn) · `CardFilters` ·
`CardGridLinks` · `PackRanking` · `SiteChrome`

## The closed set

The goal is a closed vocabulary: an agent writing a feature picks from this list
or extends it, and cannot reach for a raw element. Native tags are banned outside
`src/components/` by lint, so "just use a `<button>`" stops being available.

### Built

`Button` (6 variants) · `Icon` (Lucide) · `Panel` · `HairlineList` + `HairlineRow` ·
`EmptyState` · `Heading` (page · section · sub)

### Missing — these are what the app still does with raw elements

| Component | Replaces | Needs Radix? |
| --- | --- | --- |
| `Select` | 4 native `<select>` | **Yes** — keyboard, typeahead, aria, positioning |
| `Dialog` | 1 `window.confirm` | **Yes** — focus trap, escape, scroll lock |
| `Checkbox` | 1 native `<input type=checkbox>` | **Yes** — indeterminate state, label wiring |
| `TextInput` | search field, deck name | No |
| `Textarea` | decklist paste | No |
| `Chip` | energy filters, toggle-style filters | No |
| `Badge` | `estimated`, rarity tag, copy counter — three things doing one job | No |
| `Stat` | the big number plus its label in the ranking | No |
| `Bar` | the proportional bar in each ranking row | No |

### Domain components — not part of the generic set

`CardImage` · `StaticCardImage` · `CardTile` · `DeckCardTile` · `OwnedPill` ·
`EnergyIcon` · `Icon` · `CardFilters` · `CardGridLinks` · `PackRanking` ·
`SiteChrome`

### The trade-off accepted

A native `<select>` opens the operating system picker on mobile, which is better
than any custom one and is where this game is played. Replacing it is a
deliberate cost, paid for consistency and full visual control.

## What can become a hard rule, and what cannot

The distinction matters more than the manual's contents: a rule that cannot be
checked is a suggestion, and this codebase is written largely by agents.

**Enforceable today** (the infrastructure exists — `eslint.config.js`,
`test/contrast.test.ts`)
- Colour only through tokens — *already enforced*
- Contrast ratios of every token — *already enforced*
- Spacing only on the scale (no arbitrary `p-[13px]`)
- Radii only from the four defined steps
- Type only from the seven defined sizes
- Interactive targets at or above a minimum height
- No duplicated utility combination above N occurrences — this is the rule that
  would have caught every row in the table above

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
