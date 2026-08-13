# VPS deployment plan and roadmap

Status: Epic 0 and Epic 1 complete; Epic 2 implementation prepared, external validation blocked

Last updated: 2026-08-13

## Goal

Deploy the static DeployLab site to VPS `138.124.85.193` through a reproducible,
reviewed GitHub Actions and GHCR release flow. The final domain must serve the
generated Nuxt routes over HTTPS with correct canonical URLs, security/cache
headers, a tested rollback path, and no source code or secrets embedded in the
image.

In plain language: the website will be packed into one small container, checked
before release, and installed on the server only after an owner approves it.
When a new version has a problem, the release process returns to the last known
working version. Visitors will receive the site through the supplied domain and
HTTPS after its DNS record is ready.

## Non-goals

- Add a backend, database, form delivery, CMS, user uploads, or runtime Node
  server.
- Deploy before the owner supplies a final domain and configures its DNS A
  record.
- Add Kubernetes, Swarm, Watchtower, Certbot, a second proxy, zero-downtime
  slots, monitoring, or off-host backups in v1.
- Fix unrelated UI, ESLint, or development-hints debt in this branch.
- Commit, push, merge, alter GitHub settings, or mutate the VPS without the
  owner's explicit review or the corresponding approved epic.

## Constraints

- The project requires Node `24.16.0` and pnpm `11.5.2`; `pnpm generate`
  produces the deployable `.output/public` output. `NUXT_PUBLIC_SITE_URL` is a
  required build-time production value.
- Local generation, quality checks, Playwright, Lighthouse, and the Docker
  container smoke test passed on the pinned toolchain. Docker Desktop 4.86.0,
  Docker Engine 29.7.2, and Docker Compose 5.3.1 are available locally.
- VPS discovery confirmed Ubuntu 24.04 amd64, one vCPU, 961 MiB RAM, 6.7 GiB
  free disk, free TCP 80/443, outbound HTTPS, no Docker, inactive firewall,
  and SSH currently allowing root and password login.
- The source repository is public (`iShavlovsky/deploy-lab`); the selected
  delivery model is GitHub Actions, public GHCR image, direct DNS A record, one
  Caddy runtime container, and a manually approved production workflow.
- `iShavlovsky` is the selected GitHub Environment production reviewer. A
  provider rescue console is available for the SSH-hardening step.
- Secrets and private keys belong only in GitHub Environment secrets or the
  local SSH agent. They must never enter this repository, images, command logs,
  or documentation.

## Ownership seam

- `docs/decisions/vps-deployment-architecture.md` owns durable architectural
  choices: runtime shape, image delivery, TLS/DNS, release approval, VPS
  access, and rollback boundaries.
- This document owns the live epic status, acceptance evidence, runbook links,
  and blockers. It is updated when an epic changes state.
- Future Docker, Caddy, Compose, GitHub workflow, and smoke-test files own the
  implementation; this roadmap does not duplicate their executable settings.
- GitHub Environment `production` owns deployment secrets and approval. The
  root-owned VPS wrapper owns privileged Docker operations.

## Plan

### Epic 0 — decisions, branch, ADR, and baseline

Status: Complete

1. **Complete** — create `codex/vps-deploy` from verified `origin/main`.
2. **Complete** — record accepted deployment decisions in the VPS architecture
   ADR without adding executable infrastructure configuration.
3. **Complete** — create this living task-intake plan and roadmap; link both
   documents from the documentation index.
4. **Complete** — run the documentation-focused checks and inspect the diff.
5. **Complete** — owner authorised the scoped local documentation commit after
   reviewing the plan and decisions.

Acceptance: the branch is isolated from prior page work; decisions are
traceable in one ADR; this roadmap states current evidence, remaining work, and
stop conditions without secrets or speculative implementation details.

### Epic 1 — reproducible static image

Status: Complete

Docker Desktop 4.86.0 is installed and running locally. Docker Engine 29.7.2
and Docker Compose 5.3.1 were verified from this worktree before implementation.

Execution order for the remaining work:

1. **Complete — deterministic font input.** Set the global Nuxt Fonts provider
   to Google in addition to the existing family declarations. Run
   `pnpm generate` and prove that the build no longer requests Fontshare. This
   is a source-build concern; no dependency is required.
2. **Complete — minimal image boundary.** Add a Debian-based Node `24.16.0` /
   pnpm `11.5.2` builder, a pinned official Caddy runtime, and a `.dockerignore`
   that excludes Git metadata, local environment files, dependencies, test
   artifacts, and generated directories. The only builder output copied into
   the runtime image is `.output/public` plus the Caddy configuration. Generated
   `/_ipx` assets are already part of that static output, so the runtime has no
   Node or IPX service.
3. **Complete — static serving contract.** Add one Compose service with persistent
   Caddy data/config volumes, `restart: unless-stopped`, and a loopback-only
   local HTTP binding. Public 80/443 exposure remains a later VPS/TLS decision.
   Require `NUXT_PUBLIC_SITE_URL` during the image build;
   use no domain placeholder for production. Configure Caddy to serve files from
   `/srv`, return generated `404.html` with HTTP 404, cache only hashed assets,
   and set the agreed HTTP headers without adding a second CSP.
4. **Complete — container acceptance test.** Add a shell-based local smoke test
   that starts the Compose service on a non-conflicting local port, waits for a
   health response, and checks `/`, `/privacy-policy`, generated SEO files,
   a hashed `/_nuxt`, `/_fonts`, or `/_ipx` asset cache header, response security
   headers, and an unknown path returning status 404. It must not need a real
   domain or public TLS.
5. **Complete — Linux reproducibility proof.** Run Docker build for
   `linux/amd64`, `docker compose config -q`, `caddy validate`, image-content
   inspection, smoke test, restart persistence, and the existing static quality
   gate. Capture the exact Caddy digest only after these checks pass; then Epic
   1 can be reviewed for closure and Docker CI work can begin in Epic 2.

Acceptance: a clean `linux/amd64` static image can serve all public routes over
local HTTP; no image contains `.env`, source checkout, Node runtime, or secrets.

### Epic 2 — CI, registry, and approved delivery

Status: Implementation prepared; external GitHub validation blocked

Goal: publish a reproducible `linux/amd64` static image for every approved
`main` commit, without automatically touching the VPS. Prepare the protected
manual release boundary; connect it to the VPS only after the wrapper and its
key material exist in Epic 3.

Non-goals: do not add automatic deployment, a PAT, Docker Hub, a second
registry, image signing/attestations, a vulnerability-scanning platform, a
domain placeholder, or a secret before its owner and lifecycle exist.

Constraints and planning findings:

- The repository is public and its default branch is `main`. No GHCR package
  named `deploy-lab` exists yet.
- The current account `f7one` has repository role `write`, not administrative
  access. The GitHub Actions policy endpoints return HTTP 403. Repository owner
  `iShavlovsky` must apply the required GitHub settings or explicitly grant the
  required administrative access.
- Existing `.github/workflows/ci.yml` references moving action tags. Epic 2
  must replace every action reference in the existing and new workflows with a
  verified full commit SHA from its official upstream repository.
- `actionlint` 1.7.12 is installed locally through Homebrew. It is a developer
  CLI, not an application dependency; no npm package was added.
- A deployer SSH key and verified `known_hosts` entry cannot be created before
  Epic 3. Therefore no production secret and no SSH command may be enabled in
  this epic. The future release workflow is prepared and protected here, then
  receives its secret-consuming deployment step only after Epic 3 acceptance.

Execution order for the remaining work:

1. **Partial — confirm GitHub ownership path and verification tool.**
   `actionlint` 1.7.12 is installed through Homebrew. The current account
   remains `write`-only; obtain owner `iShavlovsky`'s confirmation for Actions
   policy and Environment settings. Record the actual configuration and tool
   version as evidence; do not store tokens, private keys, or `known_hosts`
   values in the repository.
2. **Complete — harden the workflow supply chain.** Resolve each required action
   from its official repository and pin it by full commit SHA, including the
   existing quality workflow. Set workflow/job permissions explicitly to the
   minimum needed: read-only contents by default, then `packages: write` only
   in the GHCR publishing job. Keep pull-request builds unable to push packages
   or read production secrets.
3. **Implemented; awaiting `main` and final domain — add container CI and immutable GHCR publication.** Add a Docker
   verification job for pull requests using the existing static-container smoke
   test, with a non-production build URL. On a successful `main` run, build and
   publish only `linux/amd64` to `ghcr.io/ishavlovsky/deploy-lab`, tagging it
   with the full source SHA and recording OCI source/revision metadata. Resolve
   and report the resulting registry digest; never publish `latest`.
4. **Blocked — create and verify the package boundary.** After the first
   reviewed successful publication, confirm that the package is linked to this
   repository through OCI source metadata. Repository owner `iShavlovsky` must
   explicitly change it to public, acknowledging that GitHub does not permit reverting a
   public container package to private. Prove an anonymous pull of the exact
   digest before relying on it from the VPS.
5. **Implemented; external configuration blocked — create the protected manual-release boundary.** Repository owner
   `iShavlovsky` creates GitHub Environment `production`, restricts it to
   `main`, and assigns themselves as required reviewer. Add a concurrency-protected
   `workflow_dispatch` workflow accepting exactly one full 40-character commit
   SHA. It verifies that the SHA is reachable from `main`, resolves the matching
   immutable GHCR digest, and exposes the selected release in the protected
   Environment. It performs no SSH operation and has no secret until Epic 3
   creates the deployer key, `known_hosts`, and root-owned wrapper.
6. **Partial — test and document the boundary.** Lint all workflow YAML with
   the approved `actionlint` tool; validate Docker/Compose locally; inspect
   permissions, action SHAs, triggers, and absence of secret references in PR
   jobs. After a reviewed push to `main`, inspect the Actions run, package tags,
   OCI labels, digest pull, Environment approval wait, invalid-SHA rejection,
   concurrency behaviour, and the fact that no VPS call occurred. Update this
   roadmap with real run URLs/identifiers only if they contain no secrets.

Acceptance: a reviewed full-SHA image is published to public GHCR and can be
selected manually by digest. Pull-request jobs cannot publish or reach
production secrets. The protected Environment requires `iShavlovsky` approval;
it intentionally contains no deploy key and performs no VPS action until Epic
3 completes the secure wrapper and key setup.

Implementation evidence recorded 2026-08-13: Homebrew `actionlint` 1.7.12
validated both workflow files. `ci.yml` now uses only full commit SHA action
references, has read-only default permissions, runs the existing Docker smoke
test for pull requests, and limits `packages: write` plus the GitHub token to
the `main`-only publication job. `release.yml` accepts one lowercase
40-character SHA, verifies it is an ancestor of `main`, resolves its GHCR
digest, serializes releases with `production-release`, and performs no SSH
operation or use of deployment secrets. Publication is deliberately skipped
until repository variable `PRODUCTION_SITE_URL` is set to the real canonical
origin. The remaining proof requires a reviewed push to `main`, owner-created
Environment `production`, explicit package public visibility, and the final
domain; none were changed in this epic.

The full local closing gate also passed: the Docker smoke test and Compose
configuration validation, static quality checks (42 unit tests), dependency
checks, `pnpm build`, static generation, Playwright (25 passed, 5 intentional
skips), Lighthouse, secret scan, Contour checks, formatting, and diff check.
The existing 15 ESLint warnings and Nuxt development-hint warnings remain
outside this deployment scope and caused no test failure.

### Epic 3 — VPS preparation and hardening

Status: Pending Epic 2

1. Install the official Docker Engine and Compose plugin, create persistent
   deployment directories, and configure log rotation.
2. Create `deployer`, its two key-based access paths, and a root-owned,
   digest-only deployment wrapper with automatic rollback on failed smoke.
   After the key and host identity are verified, place them as GitHub Environment
   `production` secrets and connect the already protected manual-release
   workflow to this wrapper.
3. Enable firewall rules for TCP 22/80/443 and verify Docker packet filtering.
4. Verify a second key-only SSH session and rescue console, then disable root
   and password SSH access.
5. Prove Docker restart after reboot and retain Caddy state across recreation.

Acceptance: the VPS exposes no service other than SSH/HTTP/HTTPS, does not
store GitHub credentials, and can deploy or roll back only through the approved
wrapper.

### Epic 4 — domain, TLS, and first release

Status: Blocked until the owner supplies the final domain and creates its A
record

1. Set `PRODUCTION_SITE_URL=https://<domain>` and `DOMAIN=<domain>` in GitHub
   Environment; rebuild the selected SHA image with that exact origin.
2. Wait for public A-record resolution to `138.124.85.193`, then approve and
   run the manual release workflow.
3. Prove TLS, HTTP-to-HTTPS, routes, assets, 404 status, canonical/sitemap/
   robots/schema output, security/cache headers, desktop/mobile browser smoke,
   and production Lighthouse.
4. Record the deployed SHA and digest in this roadmap.

Acceptance: the site is reachable on its canonical HTTPS origin and all static
SEO output uses precisely that origin.

### Epic 5 — rollback rehearsal and handoff

Status: Pending Epic 4

1. Roll out a subsequent approved SHA, then deliberately return to the prior
   digest through the same release path.
2. Verify public smoke, TLS state, and restart persistence after rollback.
3. Add concise deploy, rollback, and recovery commands to this document and
   update every epic with actual evidence.

Acceptance: an operator can identify the live digest and restore the prior
release without rebuilding on the VPS or using undocumented credentials.

## Verification

### Epic 0 evidence to collect

1. `pnpm task:intake:check --file docs/plans/vps-deployment.md`.
2. `pnpm format:check`.
3. `pnpm quality:static` on Node 24.16.0 and pnpm 11.5.2.
4. `pnpm secrets:check`, `pnpm contour:doctor`, `git diff --check`, and
   `git status --short`.

Epic 0 changes neither rendered UI nor production runtime behaviour. The full
project gate was nevertheless run before closing the epic. Every later epic
repeats the relevant static gate; Epic 1 adds local container proof, Epic 3
adds VPS safety checks, and Epic 4/5 add public browser, TLS, SEO, and rollback
proof.

Evidence recorded 2026-08-13: task-intake and Prettier checks passed;
`quality:static` passed with 42 unit tests; Gitleaks found no secrets;
`contour:doctor` passed all checks; and `git diff --check` passed. ESLint
reported the existing 15 warnings in UI files outside this documentation scope,
with no errors. `setup:doctor` is not worktree-safe: it checks `.git/hooks`
even though this linked worktree correctly stores hooks in the common Git dir.
This tooling defect is documented but not fixed in the deployment branch.

Full closing gate recorded 2026-08-13: `pnpm build` and `pnpm generate`
passed, including the generated-site link checker with zero errors and zero
warnings. Playwright reported 25 passing tests and five intentional skips.
Lighthouse passed its assertions for `/` and `/privacy-policy`. Dependency,
cycle, dead-code, secret, contour, and diff checks passed. Docker runtime
validation is recorded below as Epic 1 evidence.

### Epic 1 evidence

Recorded 2026-08-13: global Google Fonts configuration generated the site without
Fontshare requests. `docker compose config -q`, `caddy validate`, and
`pnpm test:docker:smoke` passed. The smoke test builds the image, waits for its
healthcheck on an allocated loopback port, checks public routes, SEO files,
security/cache headers, a generated asset, a genuine 404 response, final-image
contents, and a container restart. A separate `docker build --platform
linux/amd64` passed with `https://deploylab.example` as the required build
argument; the resulting Caddy-only image validated successfully and measured
39.7 MB. Its Caddy base-image digest is
`sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d`.
The full closing gate was then repeated after the Epic 1 changes: formatting,
static quality (including 42 unit tests), dependency checks, `pnpm build`,
production-like static generation, Playwright (25 passed, 5 intentional skips),
Lighthouse, secret scanning, Contour checks, and `git diff --check` all passed.

## Risk and stop condition

- Do not begin Epic 2 until the owner reviews and explicitly approves the Epic 1
  implementation and its local commit.
- Stop Epic 4 until the owner provides the exact canonical domain and its A
  record resolves publicly. Do not publish an IP-based site with placeholder
  canonical URLs.
- Stop a VPS rollout immediately on host-key mismatch, failed second SSH login,
  invalid SSH configuration, occupied 80/443, failed image validation,
  failed health/smoke check, or wrong canonical origin; retain or restore the
  prior digest.
- Do not modify GitHub environments, registry visibility, Docker packages,
  firewall, SSH, DNS, or production services as part of Epic 0.
- Do not push this branch. Later-epic commits require owner review and explicit
  authorisation.
