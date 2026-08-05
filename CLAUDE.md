@AGENTS.md

# Claude Code adapter

## Session flow

1. Expand the canonical import, then explicitly read every Cursor rule whose frontmatter has `alwaysApply: true`.
2. Read the matching on-demand rule in the repository’s Cursor rule directory before a task; Claude does not load that set automatically.
3. Use Claude-native configuration only for Claude mechanics; it adds to, and cannot override, the canonical router.

## Subagents

- `deploy-lab-seo-cwv-auditor` independently reviews public-page SEO, SSR, and CWV risks.
- `deploy-lab-architecture-boundary-reviewer` reviews module ownership, public contracts, and imports.
- `deploy-lab-test-log-triager` explains saved test failures without running or changing anything.
- Use a role only when its `description` matches the task; these roles are read-only and cannot spawn work or edit files.

## Hooks

- `PreToolUse` blocks irreversible shell commands with a specific reason; `Stop` rejects a turn when `git diff --check` fails.
- Hooks keep secrets unread and unprinted, leave source and Git state unchanged, and avoid publishing, deployment, or destructive commands.
- Keep a hook failure visible and fail closed rather than masking it with a broad catch or successful exit code.
