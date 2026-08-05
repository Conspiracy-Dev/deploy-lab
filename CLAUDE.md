@AGENTS.md

# Claude Code adapter

## Session flow

1. The `@AGENTS.md` import above already carries every always-on invariant inline; no separate read of an always-on `.cursor/rules/*.mdc` file is needed for those.
2. Read the matching on-demand rule in the repository's Cursor rule directory before a task, per AGENTS.md's routing table; Claude does not load that set automatically.
3. Read a Skill at `.claude/skills/<name>/SKILL.md` when the current task matches its `description`'s trigger; `disable-model-invocation: true` means Claude's own picker never offers it automatically, so this decision is explicit every time, the same as for Cursor and Codex.
4. Use Claude-native configuration only for Claude mechanics; it adds to, and cannot override, the canonical router.

## Subagents

- `deploy-lab-seo-cwv-auditor` independently reviews public-page SEO, SSR, and CWV risks.
- `deploy-lab-architecture-boundary-reviewer` reviews module ownership, public contracts, and imports.
- `deploy-lab-test-log-triager` explains saved test failures without running or changing anything.
- Use a role only when its `description` matches the task; these roles are read-only and cannot spawn work or edit files.

## Hooks

- `SessionStart` reminds the agent to read `KNOWLEDGE.local.md` if present, or to offer (never silently create) one from the template; `PreToolUse` blocks irreversible shell commands with a specific reason, blocks `--no-verify` and printing `.env` contents, and denies an agent-initiated `git commit` when `format:check`, `lint`, `lint:styles`, `slop-scan`, `guard-local-files`, or `secrets:check` has not passed; `Stop` rejects a turn when `git diff --check` fails.
- Hooks keep secrets unread and unprinted, leave source and Git state unchanged, and avoid publishing, deployment, or destructive commands.
- Keep a hook failure visible and fail closed rather than masking it with a broad catch or successful exit code.
