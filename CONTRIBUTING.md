# Contributing

Pullwise is a personal project, maintained casually rather than on a
roadmap — but issues and PRs are genuinely welcome. This is the short
version of how to send one.

## Before you write code

Check the [open issues](https://github.com/codentide/pullwise/issues) first.
Labels follow a fixed taxonomy (`bug`, `feature`, `chore`, `refactor`,
`docs`, `tech debt`, `ui/ux`, `priority:*`, `blocked`, `needs
clarification`, `on-demand`, `external`) — `on-demand` marks work that's
waiting on an external trigger (mainly the upstream card dataset publishing
something), not on anyone writing code.

If what you want to do isn't covered by an issue, open one before sending a
PR — small typo fixes aside. It saves both of us from a PR built on an
assumption that turns out to be wrong.

## House rules

**[`CLAUDE.md`](CLAUDE.md) is the real style guide.** Most of this codebase
was written by AI agents rather than typed by hand, and that changes what's
worth writing down: a rule a linter or a test can't catch tends to drift, so
`CLAUDE.md` splits rules into what's enforced by `eslint.config.js` /
`test/architecture.test.ts` (import boundaries, no raw hex, the spacing and
radius scales, ...) and what's a judgement call (voice, what counts as an
"estimate", when a card is *unknown* vs. *missing*). Read it before touching
UI or `src/lib/`.

## Setup

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm verify   # lint + typecheck + tests — this has to be green
```

CI runs `pnpm verify` and a full `pnpm build:only` on every push and PR. A
few of this project's worst bugs only showed up once real pages were
generated or the app was clicked through by hand, so `pnpm verify` passing
is necessary but isn't sufficient — actually run the page you touched.

## Domain code (`src/lib/`)

This is the one part of the app that's wrong without anyone noticing on
screen — a probability that's subtly off still renders a number. It has no
dependency on React, Next or `next-intl` (enforced by both ESLint and
`test/architecture.test.ts`), so it can be tested on plain Node. Tests here
are mandatory, not optional, and where the math allows it, check against a
second method (`test/packMath.test.ts`'s Monte Carlo vs. the theoretical
geometric distribution is the existing example) rather than only against a
hand-picked example.

## Everything else

English for code, comments and commits. Interface copy in English and
neutral Spanish (no regionalisms) — except card, set and pack names, which
stay in English in both locales because that's how they appear in the game
itself.
