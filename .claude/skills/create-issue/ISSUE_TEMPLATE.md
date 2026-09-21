# Issue shape

A Pullwise issue is written once and read at least twice — once by whoever
decides to pick it up, once by whoever (human or agent) actually implements
it — so it earns its length. Model it on how issue #1's own implementation
plan was written: evidence over adjectives, explicit boundaries, nothing left
for the reader to assume.

## Title

`PWS-0NN: <imperative, specific action>` — "Add X", "Fix Y", never a vague
noun phrase or "Y is broken". The title alone should say what ships, not just
what's wrong. The `PWS-0NN` prefix is assigned after creation, once GitHub
hands back the real issue number — see `create-issue`'s own steps.

## Body sections

**Why** (1–3 sentences) — the motivation, backed by something verifiable
when possible: a reproduced bug, a measured cost, a real user's own words —
not a guess dressed up as a fact. This is what keeps the ask from drifting
once someone starts building it.

**What** — the concrete scope of the change, specific enough that two
different people (or two different agent sessions) would build roughly the
same thing from it.

**Out of scope** (include whenever there's a real temptation to overreach) —
a short list of adjacent things this issue deliberately does *not* cover.
This is the single highest-leverage section for an agent picking the issue
up later: without it, scope creep is the default failure mode, not an
exception.

**Done when** — a short checklist, each item independently verifiable (a
test passes, a specific page renders correctly, a command succeeds) — never
"it works well" or another criterion nobody could fail to satisfy.

## What doesn't belong in an issue

- **Solution prescription beyond what's load-bearing.** State what must be
  true when it's done, not which function to write or which component to
  touch — that's `tackle-issue`'s job, informed by whatever the codebase
  actually looks like when the work starts, which may not match what it
  looked like when the issue was filed.
- **Padding.** An issue that restates its own title in different words to
  look thorough is worse than a genuinely short one that says exactly what's
  needed and stops.

## Labels

Pick exactly one type label and exactly one `priority:*`, plus any of the
status labels that genuinely apply. Run `gh label list` if this list might
have drifted:

| Label | When |
| --- | --- |
| `bug` | Incorrect or unexpected behavior |
| `feature` | New user-facing capability |
| `chore` | Tooling, config, dependencies, setup |
| `refactor` | Internal change, no user-facing effect |
| `docs` | Project documentation |
| `tech debt` | Technical debt to pay down |
| `ui/ux` | Visual design, interaction, design system |
| `marketing` | Acquisition, branding, distribution |
| `priority:high` / `:medium` / `:low` | Exactly one, always |
| `blocked` | Can't proceed until a real dependency resolves |
| `needs clarification` | Missing definitions before it's buildable |
| `on-demand` | Ready to go, waiting on an external trigger named in the issue |
| `external` | Human-only action outside the code (paperwork, purchases, third parties) |
