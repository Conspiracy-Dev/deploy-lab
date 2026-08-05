---
name: deploy-lab-plain-language-handoff
description: Produces a non-technical summary of a completed DeployLab change for a reviewer who does not read code or diffs — plain-language description, URL to check, a short look-and-tell checklist, and an explicit approve/reject question. Use when a completed task has user-visible impact (a page, copy, layout, or interaction change). Do NOT use for an internal-only change with no visible effect (config, tooling, tests, dependency bump) — deploy-lab-verify-before-done's report is enough there.
disable-model-invocation: true
---

## Instructions

1. State what changed in one plain sentence: no code, no file names, no jargon
   ("the homepage headline now says X" rather than "updated `index.vue`").
2. Give the exact local URL and, if relevant, the page section or state to look
   at; if the change has no visible page impact, say that plainly instead of
   inventing a URL.
3. List 3-5 concrete things to look at, each phrased as a question answerable
   by looking rather than by reading code, for example: "Does the heading say
   what you expect?", "Does the button still work if you make the window
   narrow?", "Does anything look broken or misaligned?"
4. State verification status in one line without command output or jargon
   (for example: "All automated checks passed" or "One check is still red —
   see the technical report for why"); point to `deploy-lab-verify-before-done`'s
   report for anyone who wants the detail.
5. End with an explicit question — "Does this look right to you?" or "Anything
   you want changed before this goes further?" — and wait for an answer. Silence
   is never approval.

## Examples

- Trigger: a new or changed page, a copy change, a layout or design change, a
  new interactive element.
- Non-trigger: a CI workflow tweak, a dependency bump, an internal refactor
  with no visible page effect — use `deploy-lab-verify-before-done` alone.
