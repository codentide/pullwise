---
name: create-issue
description: Create a well-scoped GitHub issue for Pullwise and assign it the project's PWS-0NN code. Use when the user asks to file, open, log, or track a new issue, task, bug or feature for this project.
---

# create-issue

Turns a rough ask into a properly scoped GitHub issue, then labels it with
Pullwise's `PWS-0NN` code. The number is only known once GitHub creates the
issue, so the code is assigned as an immediate follow-up edit — never chosen
upfront, and never anything but that issue's own number, zero-padded to 3
digits. `PWS-011` is issue #11, always; there is no separate counter to keep
in sync.

## Input

Whatever the user gave you describing the task — a sentence, a bug report, a
feature idea, possibly nothing more than a link or a repro. It is never
pre-formatted. Drafting the actual issue is this skill's job, not the
caller's.

## Steps

1. **Read `.claude/CLAUDE.md` and `docs/decisions.md`** if you haven't already this
   session. An issue that contradicts a documented decision, or restates one
   that already has a settled answer, is worse than no issue.

2. **Investigate before writing.** If the ask references specific behavior
   ("the pack page is missing X", "add a button that does Y"), check the
   actual code first — grep for the relevant route, component or lib
   function. Don't draft an issue on an assumption a two-minute look would
   have corrected, and don't duplicate one that already exists
   (`gh issue list --search "<keywords>"`).

3. **Draft the issue** following `ISSUE_TEMPLATE.md` in this same skill
   directory: a specific, imperative title, then Why / What / (Out of scope,
   when relevant) / Done when. Pick labels per that file's table — exactly
   one type label, exactly one `priority:*`, plus `blocked` / `needs
   clarification` / `on-demand` / `external` only when genuinely true.

4. **Ask before publishing** only if something is genuinely load-bearing and
   unclear — priority, a scope boundary with two real readings, whether it
   overlaps an open issue you found in step 2. A public GitHub issue is
   cheap and reversible (editable, closeable), so don't hold up a
   well-scoped, unambiguous ask waiting for approval it doesn't need.

5. **Create it, then rename it in the same breath** — not two steps with a
   gap, one flow. There is no way to know or reserve the number beforehand:
   GitHub only assigns it at creation, issues and PRs share one counter for
   the repo, and anything else opened in between would make a guess wrong.
   Reading the real number back after creating is the fastest path that's
   also actually reliable, not a workaround for a limitation:
   ```
   url=$(gh issue create --title "<draft title, no code yet>" --body "<body>" \
     --label "<type>" --label "priority:<level>" [--label "<status>" ...])
   number=${url##*/}
   code=$(printf 'PWS-%03d' "$number")
   gh issue edit "$number" --title "$code: <original title>"
   ```
   `gh issue create` prints the new issue's URL on success — `$number` comes
   straight out of it, no extra lookup call needed.

7. **Add a row to `docs/backlog.md`'s Open table**, matching the shape of the
   existing rows, then commit and push. `docs/backlog.md` is docs-only, so the
   version-bump pre-push hook doesn't apply to this commit.

8. **Report back** the code, the title, and the URL. That code (`PWS-0NN`)
   is exactly what gets passed to `tackle-issue` later.
