---
name: tackle-issue
description: Pick up a Pullwise issue by its PWS-0NN code — understand it, investigate the codebase, plan, ask what's genuinely unclear, then implement and close the loop. Use when the user says to work on, tackle, start, pick up, or implement a specific PWS-0NN task.
---

# tackle-issue

Takes a `PWS-0NN` code and does the actual work of understanding the issue
behind it well enough to build it correctly — before writing any code, and
without assuming the issue still describes the codebase as it stands today.

## Input

The code, e.g. `PWS-011`. Strip the prefix and leading zeros to get the
GitHub issue number: `PWS-011` → `11`.

## Steps

1. **Fetch the real issue, not a memory of one**:
   ```
   gh issue view <number> --json number,title,body,labels,state,comments
   ```
   If the title doesn't start with exactly that `PWS-0NN` code, stop and say
   so before doing anything else — the number might be right but this might
   not be the intended issue, or it was never renamed by `create-issue`.

2. **Read `CLAUDE.md` and `docs/decisions.md`.** The issue says *what*;
   these say the constraints and the reasoning already settled, that the
   implementation isn't free to quietly contradict.

3. **Investigate the codebase specifically for this issue** — not a generic
   skim of the repo. Find every file the change will plausibly touch and
   read them fully. Check whether anything the issue assumes is still true:
   an issue filed a while ago may describe code, routes or data shapes that
   have since changed. Use Explore or targeted grep — don't reason from the
   issue text alone as if it were the current source of truth.

4. **Look for what the issue didn't anticipate.** This project's worst bugs
   were things nobody thought to check (`docs/decisions.md` has the running
   list). If the issue's "Done when" section has a gap a real edge case would
   fall through, name it before implementing — either as a clarifying
   question (step 6) or as an explicit addition to the plan.

5. **Form a real plan.** For anything beyond a trivial, obviously-scoped
   change, use `EnterPlanMode`. The plan names the exact files it will touch,
   the approach, and what's explicitly out of scope — mirroring the issue's
   own "Out of scope" section if it has one, or setting one if it doesn't.

6. **Ask every question that actually blocks a correct implementation** —
   before exiting plan mode, not mid-implementation. A real missing decision
   (which library, what the empty state does, whether this needs a version
   bump) is worth one question now instead of a wrong guess baked into the
   diff later. Don't ask what the issue or the codebase already answers —
   that's a step-3 failure, not a good question.

7. **Exit plan mode and implement** once the plan is approved. Follow
   `CLAUDE.md`'s enforced rules and judgement calls, write or extend tests
   for anything in `src/lib/` (mandatory there, per `CLAUDE.md`), run
   `pnpm verify` before every commit, and apply the version-bump policy from
   `CLAUDE.md`'s Versioning section — decide patch vs. minor by what actually
   shipped, not by habit.

8. **Verify by hand when it's visual**, not only by test. Screenshot the
   actual state(s) this touches — every real bug logged in
   `docs/decisions.md` this project has shipped was found that way, none of
   them by code review alone.

9. **Close the loop**: commit, push, and
   `gh issue close <number> --comment "..."` — the comment describes what's
   actually true now, not a copy of the issue body. If the change is a
   decision worth remembering per `CLAUDE.md`'s own rule on
   `docs/decisions.md`, add that entry in the same commit rather than as an
   afterthought.
