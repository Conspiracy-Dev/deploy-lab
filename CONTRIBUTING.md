# Contributing to DeployLab

## Start with the contract

Read `AGENTS.md`, then the smallest relevant product, architecture, and test
files before editing. A request is not a licence for adjacent refactors,
dependency additions, API changes, or client-only rendering.

For AI-assisted work, turn an ambiguous prompt into a small, falsifiable change:
state the intended result, identify the owning boundary, select the narrowest
verification, and stop when the evidence contradicts the premise. Apply YAGNI:
add abstractions only when they protect a real current boundary.

## Local setup

```text
corepack enable
pnpm setup
pnpm dev
```

This portable command sequence works on Windows, macOS, and Linux. `pnpm setup`
never overwrites an existing `.env` or changes global Git configuration; it
installs the exact lockfile, verified Gitleaks tool, and Lefthook locally. Use
Node.js 24 and pnpm 11 as declared in `package.json`. Do not commit `.env`,
tokens, browser state, generated runtime directories, or personal credentials.

## Delivery flow

1. Inspect `git status --short` and preserve unrelated work.
2. For an ambiguous or high-impact request, use `deploy-lab-task-intake` to
   produce a small approved plan; otherwise read the appropriate rule or Skill
   from the router. Use Figma only with a
   node-specific URL and explicit approval for writes.
3. Make the smallest scoped change and add or update focused tests when
   behaviour changes.
4. Run the relevant checks. UI changes require a real browser check or
   screenshot in addition to static checks.
5. Review `git diff --check` and the changed-file list before asking to commit.
6. Use a Conventional Commit message. Commit and push only with explicit owner
   approval.

## Commit messages

Lefthook runs Commitlint at `commit-msg`. Use:

```text
type(optional-scope): imperative summary
```

Examples:

```text
feat(hero): add semantic fallback copy
fix(seo): preserve canonical origin
docs(contributing): clarify delivery flow
```

The subject is concise, imperative, and describes the actual diff. Do not hide
unrelated changes in a broad message such as `update` or `fix stuff`.

## Pull requests and review

Explain the problem, boundary, behaviour change, verification, and residual
risk. Preserve public contracts unless the task explicitly authorises a change.
For SEO, rendering, or CWV work, state how indexability, layout stability, and
browser proof were checked.

## Security and conduct

Report vulnerabilities privately under [SECURITY.md](SECURITY.md), never in a
public issue. Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) in all project
spaces.
