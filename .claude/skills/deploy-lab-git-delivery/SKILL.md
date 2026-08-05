---
name: deploy-lab-git-delivery
description: Prepares a scoped Commitlint-valid commit or approved push for DeployLab. Используй при просьбе подготовить, создать или отправить commit/push. НЕ используй для проверки качества кода без доставки — вместо этого используй deploy-lab-verify-before-done.
disable-model-invocation: true
---

## Instructions

1. Confirm whether the user authorises only preparation, a local commit, or a
   push; never infer commit or push permission from green checks.
2. Inspect `git status --short`, the scoped diff, `CONTRIBUTING.md`, and
   `OWNERS.md`; preserve unrelated work and stop if the intended file scope is
   unclear.
3. Classify the actual change with Conventional Commits and draft one concise
   imperative message in the form `type(optional-scope): summary`.
4. Run the narrowest relevant verification; delegate the full completion gate
   to `deploy-lab-verify-before-done` when the change is substantive.
5. Stage only the user-approved files. Recheck the staged diff before a commit.
6. Let Lefthook run Commitlint at `commit-msg`; if it rejects the message,
   correct the message rather than bypassing the hook.
7. Push only after an explicit user request and report the exact branch,
   changed files, verification evidence, and remaining risk.

## Examples

- Trigger: “Подготовь коммит для изменений SEO и отправь его после моего
  подтверждения.”
- Non-trigger: “Почему ESLint ругается на этот компонент?” Use
  `deploy-lab-verify-before-done` or the relevant implementation Skill instead.
