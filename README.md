# DeployLab ✦

> A fast, indexable Nuxt foundation for the DeployLab company site — designed
> for vivid interfaces without trading away SEO, accessibility, or Core Web
> Vitals.

## What this repository is for

DeployLab is the frontend foundation for a public company site. It favours
server-rendered or prerendered content, explicit architecture boundaries, and
small browser-only enhancements. The current route is the implemented Figma
homepage; its contact form is deliberately visual-only until a separate delivery
task is approved.

| ✦ Product constraint | How the project responds                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Discovery            | Semantic HTML, metadata, canonical URLs, `robots.txt`, and sitemap support                   |
| Fast rendering       | Minimal client JavaScript, stable layout, deferred non-essential 3D                          |
| Maintainability      | Nuxt 4 + TypeScript, explicit boundaries, focused tests and deterministic tooling            |
| Design fidelity      | Figma design context is adapted to the existing Nuxt and token system, never pasted verbatim |

## Stack

- Nuxt 4, Vue 3 and TypeScript
- Nuxt Image, Fonts, SEO and Security for media, discovery and headers
- Nuxt Content with typed frontmatter
- UnoCSS plus native CSS design tokens; Reka UI primitives; VueUse composables
- Playwright, Vitest, ESLint, Stylelint, Prettier and architecture checks

## Start locally

Requirements: Node.js 24 and pnpm 11 through Corepack. The first-start flow is
the same on Windows, macOS, and Linux: it uses Corepack and Node scripts rather
than a PowerShell-, Bash-, or package-manager-specific bootstrap.

```text
corepack enable
pnpm setup
pnpm dev
```

`pnpm setup` installs the pinned lockfile, copies `.env.example` only when
`.env` is absent, installs Git hooks, provisions the verified Gitleaks binary,
and checks the local toolchain. Re-run `pnpm setup:doctor` to diagnose a local
machine. Set `NUXT_PUBLIC_SITE_URL` to the canonical production origin before a
deploy; it drives canonical links, `robots.txt`, and `sitemap.xml`; the example
origin is only a local and CI fallback.

## Verify the static container

Docker Desktop is required for the container check. The smoke test builds the
static image, exposes it only on a temporary loopback port, verifies generated
routes, SEO files, headers, assets, a real 404, and restart recovery, then
removes its test container and volumes.

```text
pnpm test:docker:smoke
```

The image build requires `NUXT_PUBLIC_SITE_URL`; use the final HTTPS domain only
for a release image. The local smoke test supplies a temporary localhost value
solely to verify the container boundary.

## Work with confidence

```powershell
pnpm format:check
pnpm lint
pnpm lint:styles
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm generate
pnpm lighthouse
```

Use the narrowest command chain that covers the change. A UI change also needs
browser evidence; static checks alone do not prove visual behaviour. See
[CONTRIBUTING.md](CONTRIBUTING.md) for delivery rules and
[AGENTS.md](AGENTS.md) for the AI contour.

## Architecture at a glance

- `app/` owns routes, UI composition, browser lifecycle, and page styling.
- `app/components/home/` owns the Figma homepage compositions; essential text
  and controls remain semantic and SSR/prerendered.
- `shared/` contains pure reusable contracts and transformations.
- `server/` owns Nitro boundaries and integrations; it never imports from
  `app/`.
- `content/` owns validated collection data. New fields begin in the collection
  schema.

The deployment profile is static. Do not add SSR/hybrid route rules without
updating the verification profile and documenting the reason.

## AI-assisted work

The canonical router is [AGENTS.md](AGENTS.md). It tells agents which contract,
rule, Skill, or verification command to use. For Figma work, provide a
node-specific URL; the agent starts read-only and needs explicit approval before
writing to a Figma file.

[AI-first onboarding](docs/onboarding/README.md) supplies role-specific minimum
context, portable clean-clone bootstrap, and prompt templates. Ambiguous or
high-impact requests go through the `deploy-lab-task-intake` Skill before any
implementation; it turns intent into a small verifiable YAGNI plan and asks for
approval where the plan changes a product or architecture decision.

Start with the concise [project brief](docs/PROJECT.md) and use the linked
read-only Figma handoff only through the Figma workflow in `AGENTS.md`.

Before a commit or push, use the `deploy-lab-git-delivery` Skill. The skill
guides scope and evidence; Lefthook and Commitlint enforce the commit-message
contract mechanically.

## Contributing and ownership

- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Support](SUPPORT.md)
- [Repository ownership](OWNERS.md)

Licensed under [Apache License 2.0](LICENSE). © 2026 Igor Shavlovsky.
