# AI-first onboarding

## One portable first start

Use a terminal on Windows, macOS, or Linux; no shell-specific command is part
of this contract.

```text
corepack enable
pnpm setup
pnpm dev
```

`pnpm setup` uses the pinned pnpm 11, installs the lockfile exactly, creates
`.env` from the public template only when absent, installs Lefthook, downloads
the checksum-verified official Gitleaks binary into ignored `.tools/`, and runs
`pnpm setup:doctor`. It never overwrites `.env`, changes global Git settings,
or stores credentials. Re-run `pnpm setup:doctor` after changing a runtime or
tool installation.

## Agent intake before implementation

Read [AGENTS.md](../../AGENTS.md), then only the rule and contract selected by
its path router. For an ambiguous, cross-module, public-contract, SEO/CWV,
dependency, migration, or Figma-write task, use the
`deploy-lab-task-intake` Skill before editing. It produces a small plan with a
goal, non-goals, boundary, verification, risk, and stop condition—enough to
make a decision, not a document for its own sake.

If the plan needs a durable review artifact, validate its shape with:

```text
pnpm task:intake:check -- --file docs/onboarding/examples/verified-task-plan.md
```

The check validates sections, not product truth. The agent still has to inspect
the owning code and tests before acting.

## Context by role

| Role                      | Read first                                                                                                                                    | Do not do by default                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Implementation            | `AGENTS.md`, owning path rule, focused code and test                                                                                          | Invent abstractions or edit neighbouring modules                                       |
| SEO/CWV                   | Nuxt SEO/CWV rule, route, metadata and browser proof                                                                                          | Replace SSR/prerendering with client-only rendering                                    |
| Figma handoff             | Figma rule and supplied file/node                                                                                                             | Write, publish, or sync Figma without exact approval                                   |
| Reviewer                  | Diff, public contracts, relevant focused checks                                                                                               | Refactor the diff during a read-only review                                            |
| Delivery                  | `CONTRIBUTING.md`, `OWNERS.md`, delivery Skill                                                                                                | Commit or push without owner authorisation                                             |
| Non-technical stakeholder | The plain-language handoff at the end of a task (URL, one-sentence summary, look-and-tell checklist) from `deploy-lab-plain-language-handoff` | Read the diff, the technical plan, or command output to judge whether the work is done |

## Prompt templates

- [Turn a vague request into a plan](prompts/task-intake.md)
- [Research a bounded question](prompts/research.md)
- [Implement an approved change](prompts/implementation.md)
- [Review a stable diff](prompts/review.md)

The examples use explicit scope, constraints, evidence, and stop conditions.
They are prompts to improve a decision; they never override the user, code, or
the router.

## Design source

The current read-only handoff is [DeployLab — Copy / root node 0:1](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=0-1&p=f&m=dev).
Use it only with the Figma rule and an explicit implementation task; it does not
grant approval to alter the Figma file or override local SEO/CWV contracts.
