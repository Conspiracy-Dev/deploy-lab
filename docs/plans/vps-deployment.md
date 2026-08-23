# VPS deployment plan and roadmap

Status: Epic 0–4 complete; Epics 5–9 approved and pending implementation;
production live on `194.87.83.103`

Last updated: 2026-08-23

## Goal

Deploy the static DeployLab site to target VPS `194.87.83.103` through a reproducible,
reviewed GitHub Actions and GHCR release flow. The final domain must serve the
generated Nuxt routes over HTTPS with correct canonical URLs, security/cache
headers, a tested rollback path, and no source code or secrets embedded in the
image. After every accepted `main` change passes the complete post-merge quality
suite, GitHub prepares and verifies the exact production image automatically;
deployment still waits for a human approval in Environment `production`.

In plain language: the website will be packed into one small container, checked
before release, and installed on the server only after an owner approves it.
When a new version has a problem, the release process returns to the last known
working version. Visitors will receive the site through the supplied domain and
HTTPS after its DNS record is ready. The approval screen is the final decision
to deploy an already identified immutable image, not permission to skip tests.

## Non-goals

- Add a backend, database, form delivery, CMS, user uploads, or runtime Node
  server.
- Deploy before Epic 3 prepares and hardens the VPS.
- Add Kubernetes, Swarm, Watchtower, Certbot, a second proxy, zero-downtime
  slots, monitoring, or off-host backups in v1.
- Add staging or make production deployment fully unattended.
- Add or change branch protection, repository rulesets, merge permissions, or
  administrator bypass settings. The team lead retains merge-request review.
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
- Source VPS `138.124.85.193` is prepared and hardened but has no application
  container. It remains unchanged until explicit owner retirement approval.
  Target VPS `194.87.83.103` is the live production host: Ubuntu 24.04.4 amd64,
  kernel `6.8.0-137-generic`, Docker Engine 29.7.2, Compose 5.4.0, and bounded
  Docker `local` logging. Its ED25519 fingerprint is
  `SHA256:M6ZafTbhTX9vwa8CeZe8aucOsTz9sD8tGUZWUV6t5cI` and is stored as the
  protected Environment known-host value.
- Target root/password SSH are disabled. `iptables-persistent` enforces
  default-deny inbound traffic; public TCP 22/80/443 is allowed and Zabbix TCP
  10050 is restricted to `92.53.116.12`, `92.53.116.111`, and `92.53.116.119`.
  The Docker `DOCKER-USER` chain permits only published 80/443. No source,
  Node toolchain, or GHCR credential exists outside root Docker configuration.
- The source repository is public (`Conspiracy-Dev/deploy-lab`); the selected
  delivery model is GitHub Actions, a private GHCR image, direct DNS A record,
  one Caddy runtime container, and an automatically prepared but manually
  approved production workflow.
  The release job uses its ephemeral `GITHUB_TOKEN` for GHCR reads; the VPS
  will use a distinct root-only credential limited to `read:packages`.
- `f7one` and `iShavlovsky` have repository `admin` access. `iShavlovsky` is
  the selected GitHub Environment production reviewer. Target hardening used
  independently verified owner and Actions SSH paths; provider-console access
  was not required.
- `main` has no branch protection or ruleset by owner decision. The team lead
  reviews merge requests as an operating policy. A direct push that reaches
  `main` and passes the complete suite can therefore also become a production
  candidate; failed or incomplete `main` runs must remain unable to publish or
  reach the production approval job.
- There is no staging environment. A brief single-container production
  interruption is accepted, but every production mutation requires the scoped
  epic approval, a known recovery path, and complete public acceptance checks.
- Future owner maintenance uses a preconfigured local SSH alias with the
  private key held by the workstation SSH Agent. The alias and key stay outside
  the repository and GitHub Actions. Selecting this access mechanism does not
  authorise a connection; read-only and mutating command scopes require
  separate approval when their epic starts.
- Canonical domain `noash.net` resolves by A record to target `194.87.83.103`;
  it has no AAAA record. Repository variable
  `PRODUCTION_SITE_URL` is set to `https://noash.net`. The existing
  `www.noash.net` A record resolves elsewhere and is intentionally outside this
  release pending a separate redirect choice.
- GitHub Environment `production` contains target `PRODUCTION_HOST=194.87.83.103`,
  `PRODUCTION_SSH_USER=deployer`, and the fresh target deploy key and known-host
  value. No executable repository file contains either VPS IP; the workflow
  reads `PRODUCTION_HOST` only at run time.
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
- GitHub Actions owns candidate provenance: the current `quality` workflow and
  its publication behaviour remain unchanged; Epic 6 adds a separate read-only
  verification of the exact digest only after that workflow completes
  successfully on `main`.
- The team lead owns merge-request review. This roadmap does not replace that
  organisational control with repository settings.

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

Status: Protected delivery boundary ready; GHCR publication validation blocked

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
- The repository was transferred to `Conspiracy-Dev`. Both `f7one` and
  `iShavlovsky` have repository `admin` access; `f7one` can apply GitHub
  settings while `iShavlovsky` remains the independent production reviewer.
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

1. **Complete — confirm GitHub ownership path and verification tool.**
   `actionlint` 1.7.12 is installed through Homebrew. The current account has
   repository `admin` access; Actions are enabled with a read-only default
   token and mandatory full-SHA action pinning. Do not store tokens, private
   keys, or `known_hosts` values in the repository.
2. **Complete — harden the workflow supply chain.** Resolve each required action
   from its official repository and pin it by full commit SHA, including the
   existing quality workflow. Set workflow/job permissions explicitly to the
   minimum needed: read-only contents by default, then `packages: write` only
   in the GHCR publishing job. Keep pull-request builds unable to push packages
   or read production secrets.
3. **Implemented; awaiting `main` — add container CI and immutable GHCR publication.** Add a Docker
   verification job for pull requests using the existing static-container smoke
   test, with a non-production build URL. On a successful `main` run, build and
   publish only `linux/amd64` to `ghcr.io/conspiracy-dev/deploy-lab`, tagging it
   with the full source SHA and recording OCI source/revision metadata. Resolve
   and report the resulting registry digest; never publish `latest`.
4. **Superseded by Epic 4 decision — private package boundary.** The package
   remains private. Confirm its OCI linkage and prove authenticated retrieval
   of the exact digest only through root Docker on the VPS. Do not make it
   public or rely on anonymous pulls.
5. **Complete — create the protected manual-release boundary.** Repository
   owner `f7one` created GitHub Environment `production`, restricted it to
   `main`, and assigned `iShavlovsky` as required reviewer with self-review
   disabled. Add a concurrency-protected
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

Acceptance: a reviewed full-SHA image is published to private GHCR and can be
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
origin. It is now set to `https://noash.net`. The `production` Environment is
configured exactly as specified:
only branch `main`, `iShavlovsky` as required reviewer, and self-review
disabled. Repository policy now requires full-SHA action pinning while keeping
the default workflow token read-only. The remaining proof requires a reviewed
push to `main` and the selected private-package access model. No image, registry
package, secret, VPS service, or production release was changed in this epic.

The full local closing gate also passed: the Docker smoke test and Compose
configuration validation, static quality checks (42 unit tests), dependency
checks, `pnpm build`, static generation, Playwright (25 passed, 5 intentional
skips), Lighthouse, secret scan, Contour checks, formatting, and diff check.
The existing 15 ESLint warnings and Nuxt development-hint warnings remain
outside this deployment scope and caused no test failure.

### Epic 3 — VPS preparation and hardening

Status: Complete on 2026-08-13. No application image has been deployed.

Goal: prepare `138.124.85.193` to run one immutable Caddy image securely,
without cloning this repository or storing GitHub credentials on the host.

Non-goals: do not build the Nuxt application on the VPS; deploy a placeholder
or IP-only site; enable `www.noash.net`; add swap, a database, a control panel,
Docker group membership for `deployer`, unattended container updates, or a
second proxy.

Constraints and planning findings:

- Ubuntu 24.04.4 amd64 is patched and running after a verified reboot. It has
  one vCPU, 961 MiB RAM, no swap, and about 6.1 GiB free disk after Docker and
  Caddy validation image installation. Server-side application builds remain
  out of scope.
- Docker Engine 29.7.2 and Compose 5.4.0 are installed from Docker's official
  apt repository; `docker.service` is enabled. `/etc/docker/daemon.json` uses
  the `local` driver with 10 MiB files and three retained files.
- SSH exposes TCP 22 only. Root and password authentication are disabled.
  `deployer` has the Actions ED25519 key fingerprint
  `SHA256:kWHFb/fFjkiJOPuKmj6CzCKtPTTWfa++awLgebh1vQc` and the owner recovery
  RSA key fingerprint `SHA256:DPO9NWfnu2+Pwu4l0e+rMW+PIdZk8x52vwB8g/zcf44`.
  The Actions key is forced to the deployment command; the owner key is an
  unprivileged shell with no sudo capability except the digest-only wrapper.
- UFW is enabled with default-deny inbound traffic and allows only TCP 22, 80,
  and 443. Docker's `DOCKER-USER` chain is present and empty, and no container
  currently publishes a port. Provider-level firewall rules cannot be inspected
  with the available tools and still need owner confirmation.
- `infra/production/` is the domain-aware Caddy/Compose configuration for
  `noash.net`; the root `compose.yaml` remains loopback-only for local smoke
  tests. The server's root-owned copy is under `/opt/deploy-lab` and has not
  started an application container.

Execution order for the remaining work:

1. **Complete — maintenance and key boundary.** A maintenance window and rescue
   console were approved. The two public keys were generated/verified by
   fingerprint only; no private key was copied to the VPS or repository.
2. **Complete — patch and baseline.** The interrupted package update was
   repaired, applied, and followed by a successful key-authenticated reboot.
   The original `/etc/sudoers` was unexpectedly empty after the repair; it was
   restored and validated with `visudo` before adding any delegated rule.
3. **Complete — minimal runtime.** Docker and Compose came from Docker's
   official apt repository; no user joined the Docker group. The Caddy runtime
   image was pulled solely to validate its production configuration.
4. **Complete — privileged deployment boundary.** `deployer` can use only
   `/usr/local/sbin/deploy-lab` through a strict sudoers digest regex. The
   root-owned wrapper rejects malformed inputs, tags, extra arguments, and
   arbitrary images; it preserves a previous digest and rolls back after a
   failed healthy rollout. A deliberate non-existent digest was rejected after
   Compose validation and no service was started.
5. **Complete — runtime configuration.** `infra/production/Caddyfile` and
   `compose.yaml` were copied root-owned to `/opt/deploy-lab`. Caddy and Compose
   validate successfully with `DOMAIN=noash.net`; Caddy state volumes persist
   by name, and the production compose file is the sole future publisher of
   TCP 80/443.
6. **Complete — network access.** UFW permits 22/80/443 with
   default-deny inbound traffic; external TCP 22 and closed Docker TCP 2375
   were checked. The owner confirmed the matching provider-firewall policy.
7. **Complete — SSH hardening.** Two independent `deployer` key logins passed;
   the Actions key cannot run arbitrary commands, `sshd -t` passed, then root
   login and password/KbdInteractive authentication were disabled. Root SSH
   rejection and both constrained deployment paths were rechecked.
8. **Complete — host acceptance.** `docker.service` is enabled,
   logging is bounded, ownership and wrapper rejection were proven, and the
   Environment secrets/variables were added after the server path worked. The
   owner-confirmed forced reboot returned SSH and the restricted deployment
   wrapper; Docker reached the registry through that wrapper after boot. The
   Caddy volume recreation and successful digest pull await the first published
   GHCR image in later epics.

Acceptance status: complete. Access, privilege, firewall, runtime
configuration, Environment-secret, and post-reboot boundaries are verified.

Plain-language summary: we will prepare the server to run only the already
built site image, not the source code. Before locking down remote access, two
independent SSH keys and the rescue console are verified so you cannot lose
access to the VPS. The first public site release still waits for an approved
image from GitHub; this epic makes that release safe to perform later.

### Epic 4 — VPS migration, domain, TLS, and first release

Status: Complete on 2026-08-15.

Goal: prepare `194.87.83.103` as a replacement for `138.124.85.193`, publish
the reviewed static image for `https://noash.net`, cut GitHub delivery over
safely, and verify the canonical HTTPS site end-to-end without enabling
`www.noash.net`.

Non-goals: do not change DNS, introduce a `www` redirect, grant broader VPS or
GitHub privileges, add a runtime service, or rehearse rollback. The latter is
Epic 5.

Execution record:

1. **Complete — target audit, maintenance, and firewall.** The target initially
   had Ubuntu 24.04.3 amd64, 961 MiB RAM, 8.9 GiB free disk, Docker 29.1.4,
   Compose 5.0.1, 63 pending updates, root/password SSH, public Zabbix 10050,
   and free 80/443. System packages were updated, Docker/Compose became
   29.7.2/5.4.0, and a reboot completed on kernel `6.8.0-137-generic`.
   `iptables-persistent` was selected after its installation removed conflicting
   UFW. It now has default-deny INPUT and a default-deny `DOCKER-USER` policy,
   allowing public 22/80/443 and Zabbix 10050 only from `92.53.116.12`,
   `92.53.116.111`, and `92.53.116.119`. Rules and Docker `local` log driver
   survived a reboot; a non-whitelisted external TCP 10050 check times out.
2. **Complete — target runtime and access.** Root-owned Caddy/Compose files and
   deployment wrapper were installed under `/opt/deploy-lab` and
   `/usr/local/sbin`. A new target Actions ED25519 key is forced to the wrapper;
   the owner key is an unprivileged `deployer` login. The only sudo rule matches
   one immutable `ghcr.io/conspiracy-dev/deploy-lab@sha256:<64 hex>` argument.
   Compose and Caddy validation passed. After verifying owner login and Actions
   command rejection, root/password/KbdInteractive SSH were disabled.
3. **Complete — private GHCR access.** The owner authenticated root Docker with
   a classic GitHub token limited to `read:packages`. The target pulled the
   exact private production image digest successfully; neither token nor private
   key is recorded in this repository.
4. **Complete — protected delivery switch.** GitHub Environment `production`
   now uses `PRODUCTION_HOST=194.87.83.103`, `PRODUCTION_SSH_USER=deployer`, a
   fresh Actions private key, and this target's verified known-host value. The
   former environment secrets were replaced rather than retained in parallel.
5. **Complete — first production release.** Public resolver checks returned
   `194.87.83.103` for `noash.net` (with no AAAA record). Approved workflow run
   [`31884433096`](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/31884433096)
   deployed commit `e6a7a52ac1f6f9a1b183a982e6d2e873a5fd9776` as
   `ghcr.io/conspiracy-dev/deploy-lab@sha256:8891c68e54ab1c6423a1e277394dc38996b260f523d3bb3e5c31dacef1f742f7`.
   The wrapper reported the release healthy.
6. **Complete — public acceptance.** With SNI pinned to the target IP, trusted
   HTTPS returned 200 for `/`, `/privacy-policy`, `/robots.txt`, and
   `/sitemap.xml`; an unknown URL returned 404. HTTP returned 308 to HTTPS;
   HSTS, nosniff, referrer, and permissions headers are present; a Nuxt JS asset
   returns `public, max-age=31536000, immutable`. `www.noash.net` was unchanged.
   The local Mac resolver still cached the old source A record during acceptance;
   independent public resolvers already returned the target, so the test used
   the resolved target IP rather than treating the local cache as a failure.
7. **Complete — document and stop.** This roadmap and ADR record the target,
   credentials boundary, network policy, release evidence, and remaining
   rollback/retirement work. Epic 5 has not started.

Key delivery facts:

- `noash.net` has target A record `194.87.83.103` and no AAAA record. The
  unrelated `www.noash.net` A record is outside this release.
- `PRODUCTION_SITE_URL=https://noash.net` is already present as a repository
  variable. It is consumed while the image is built, not during deployment;
  the image cannot be repaired by changing a VPS environment variable later.
- The production Environment accepts only `main`, requires `iShavlovsky` to
  approve, prevents self-review, and stores the deploy SSH key and known-host
  data. The release workflow accepts only a full `main` SHA, logs in to GHCR
  with its ephemeral `GITHUB_TOKEN`, resolves its digest, and invokes the VPS
  wrapper with that digest.
- The prior first release stopped safely at an anonymous GHCR digest lookup
  with HTTP 401. The corrected `main` workflow run
  `31880348420` passed and published the verified `linux/amd64` image
  `ghcr.io/conspiracy-dev/deploy-lab@sha256:8891c68e54ab1c6423a1e277394dc38996b260f523d3bb3e5c31dacef1f742f7`
  for commit `e6a7a52ac1f6f9a1b183a982e6d2e873a5fd9776`, built with
  `NUXT_PUBLIC_SITE_URL=https://noash.net`. The owner rejected public package
  visibility because that change is irreversible. The source VPS console is
  currently unavailable and HIP support has been contacted, but the migration
  does not depend on resolving that console issue. A local image is never
  deployable production proof.

Acceptance: the site is reachable on its canonical HTTPS origin through the
approved immutable digest; static SEO output uses precisely that origin; TLS,
headers, caching, routes, 404, and browser/Lighthouse checks pass; and `www`
remains untouched.

### Epic 5 — healthcheck correction and known-good baseline

Status: Complete 2026-08-22 — image A is the verified compatible known-good
baseline.

Goal: confirm the reported BusyBox `wget` failure on the live host, replace the
production probe with a compatible `curl` probe, and establish the first image
that is safe to use as the later rollback target.

Tasks:

1. **Completed 2026-08-21 — record a read-only production baseline.** The
   dedicated maintenance identity reached the target through strict host-key
   verification. Current and previous release were the old `wget` digest;
   Docker reported the Caddy container `unhealthy`, its cgroup had 1103
   processes, and its Caddy parent retained `ssl_client` zombies. Both the
   healthcheck and a generic Docker exec failed with `procReady not received`.
   The installed Compose checksum was
   `d76b188784d07743b2ecabcb95e168bae1ed2c0973b188f9e2d2e7eff10b5394`.
   Public `https://noash.net/` returned trusted HTTPS 200. This supports the
   recorded `wget` diagnosis; no CI gate or VPS state was changed.
2. **Completed 2026-08-21 — implement the minimal portable correction from current `main`.**
   Add `curl` only to the final Caddy image and replace only the production HTTPS
   healthcheck. Add a Compose regression test that uses ubiquitous `grep -Fq`
   rather than installing `rg` on the runner. Do not cherry-pick PR #9, weaken
   an existing check, add `continue-on-error`, or change Lighthouse/Playwright
   acceptance.
3. **Completed 2026-08-21 — prove the transition locally.** Validate production Compose and
   Caddy, build the production-shaped `linux/amd64` image, run the healthcheck
   repeatedly, verify no process accumulation, and exercise restart and public
   static-route smoke. Add focused shell coverage for any changed deployment
   script rather than a new test framework. The portable Compose check,
   final-image boundary, twenty repeated SNI-correct HTTPS probes, zombie check,
   restart, routes, headers, cache, and 404 smoke passed locally.
   The first PR run exposed a startup race in the isolated Caddy probe: the
   first request arrived before port 443 was listening. The smoke test now has
   a bounded 30-second readiness probe using the same HTTPS/SNI path and emits
   Caddy logs on timeout; local verification required one retry and then passed
   all twenty required probes without zombie processes.
4. **Completed 2026-08-21 — obtain owner review and deliver for team-lead
   review.** The owner reviewed the complete diff and local exit-gate results,
   authorised the corrective commit, and authorised publication. Commit
   `18d6d22` was pushed as `codex/automatic-production-deploy`; draft PR #10
   was opened against `main` and the complete GitHub Actions suite was
   triggered. Merge, workflow approval, and VPS mutation still require their
   separately scoped approval.
5. **Completed 2026-08-21 — perform the controlled production correction.** PR
   #10 merged as `c74c8d49cad2ab305a33d48d8443440c0f270e09`; its complete green
   `main` run published image A,
   `ghcr.io/conspiracy-dev/deploy-lab@sha256:653f0283674afa6e840ddecd712b6b13b7e61c8e89ba8f8a326022e6135a0bfb`.
   Approved maintenance checksum- and Compose-validated the root-owned
   `curl` Compose file (`055c8f53963f527f02e3582814e26d1d135a5d191095caac23282c067ee71bf2`)
   and retained the prior root-owned file as a recovery copy. After manual
   `production` approval, protected release workflow
   [32483198218](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/32483198218)
   deployed the matching immutable digest successfully. The provider-console
   recovery path was retained; the old `wget` digest was not used for rollback.
6. **Completed 2026-08-22 — establish image A as known-good.** Before the
   restart test image A had been healthy for more than seventeen hours with one
   cgroup process and no `ssl_client` zombies. Current recorded image is A;
   previous is the old `wget` digest. A controlled container restart returned
   healthy in six seconds and public trusted HTTPS passed afterward. `/`,
   `/privacy-policy`, `/robots.txt`, and `/sitemap.xml` returned 200; an unknown
   path returned 404; security headers and immutable Nuxt asset caching were
   present. Firewall policy remained default-drop with expected 22/80/443
   access, and Docker listeners remained on 80/443.

Acceptance: the live container is healthy with the SNI-correct `curl` probe;
the old `wget` digest is explicitly excluded from normal rollback; corrected
image A is recorded as the first compatible known-good target; and the complete
Epic 5 exit gate passes before the epic is marked complete.

### Epic 6 — independent candidate verification

Status: Complete 2026-08-22. The owner prohibited any change to the existing
CI/CD gate configured by `iShavlovsky`.

Goal: without changing current CI/CD, independently verify the exact private
GHCR artifact from a successful completed `quality` run on `main`, then retain
immutable evidence for Epic 7 to prepare a protected production approval.

Boundary: Epic 6 does not edit `.github/workflows/ci.yml` or
`.github/workflows/release.yml`; it does not change current publication,
checks, dependencies, thresholds, triggers, permissions, branch policy,
Environment, or approval rules. It adds no VPS access, deployment, approval,
or secret use.

Tasks:

1. **Complete — establish a fail-closed candidate policy.** Add a small Bash
   policy script and fixtures that receive the completed workflow event, source
   event, branch, revision, and `PRODUCTION_SITE_URL`. Only a successful
   `quality` workflow originating from a `push` to `main` with a valid absolute
   HTTPS origin is eligible. Pull requests, other refs, failed or cancelled
   runs report ineligible without registry access; an eligible `main` run with
   a missing or invalid origin fails. Do not add an npm package merely to parse
   workflow YAML.
2. **Complete — add an independent post-quality workflow.** Add a new,
   SHA-pinned workflow triggered by completion of the existing `quality`
   workflow. It runs only for a successful `push` to `main`, with explicit
   `contents: read` and `packages: read` permissions, no Environment, and no
   repository or Environment secrets. It must neither invoke nor alter a job
   in the existing CI/CD workflows.
3. **Complete — resolve the existing immutable artifact.** From the completed
   quality run's `head_sha`, retrieve the already-published GHCR SHA tag, resolve
   its digest, and form one immutable `IMAGE_REF`. Verify OCI source and
   revision metadata against that exact SHA. Do not rebuild, republish, retag,
   or grant `packages: write`; failure to find a matching published image fails
   the independent verification.
4. **Complete — smoke the published artifact, not a rebuild.** Extract the
   final-image/Caddy smoke into a reusable existing-Bash script accepting
   `IMAGE_REF` and expected canonical origin. The independent workflow pulls
   exactly the resolved digest and proves generated routes, canonical origin,
   final-image boundary, SNI health, restart, security headers, cache, and a
   real 404. It does not access the VPS.
5. **Complete — preserve provenance without promotion.** Run independent
   verification in a bounded `production-candidate` concurrency group with
   stale candidates cancelled. Before recording success, compare its revision
   with current `origin/main`; a superseded candidate succeeds only as
   ineligible and records no candidate. A successful current candidate writes
   its SHA/digest and verification outcome to the workflow summary and an
   immutable, retention-bounded artifact for Epic 7 to revalidate. Keep this
   group distinct from non-cancelling `production-release`.
6. **Complete — prove positive and negative paths.** Run policy fixtures for a
   valid completed `main` run, pull request, non-`main`, failed/cancelled run,
   absent/invalid origin, and stale revision. Make the published-image smoke
   fail for a bad image reference and missing/incorrect canonical origin. Use a
   reviewed `main` run as evidence that the independent workflow starts only
   after `quality` completes, while its failure has no path to secrets,
   production approval, or VPS mutation.
7. **Complete — close with evidence and review.** Run actionlint, ShellCheck,
   focused policy/image tests, and the full local gate. Record actual workflow
   run, SHA, digest, cancellation evidence, and no-secret outcome in this
   roadmap and ADR. Present the full diff for owner review; commit, push, PR,
   workflow dispatch, Environment approval, and VPS mutation remain separately
   authorised.

Acceptance: the pre-existing CI/CD gate is byte-for-byte unchanged; only a
successful completed `quality` run from `main` can start the independent
read-only candidate verification; the exact existing digest is smoke-tested
without rebuilding; stale or invalid candidates have no record usable for
promotion; and the complete Epic 6 exit gate passes.

Local evidence 2026-08-22: `ci.yml` and `release.yml` have no diff. The new
`verify production candidate` workflow has read-only default permissions and
grants `packages: read` only to the exact-image verification job; it has no
Environment, SSH, VPS command, cache, or `packages: write`. Policy fixtures
covered a valid `main` run, pull request, non-`main`, failed/cancelled quality,
absent/invalid origin, and stale revision. The reusable image smoke passed
against the local image; its bad-image and wrong-canonical negative paths
failed as required. `actionlint`, ShellCheck, and the existing Compose smoke
passed. The full local gate on Node `24.16.0` also passed: formatting,
typecheck, static quality (42 unit tests), dependency checks, build, generate,
Playwright (25 passed, 5 expected skips), Lighthouse, secret scan, task-intake,
and diff checks.

Live evidence 2026-08-22: PR #12 merged as
`c05cec286966919f1778ba106370dcc6c0986d29`. Its successful
[`quality` run](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/32565684305)
automatically triggered the successful
[`verify production candidate` run](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/32565982468).
The verifier confirmed the revision was current `main`, resolved and pulled
`ghcr.io/conspiracy-dev/deploy-lab@sha256:f138699caf90a0c76f54554a143f8e4fa693fe3bbc89ccfdfdbff7e346ed7fb8`,
validated its OCI provenance, and smoke-tested that exact image. It retained
the 341-byte `production-candidate-c05cec286966919f1778ba106370dcc6c0986d29`
artifact. The stale/cancelled paths remain covered by the fail-closed policy
fixtures; this positive run used neither an Environment, SSH, VPS access,
custom secret, cache, nor package-write permission.

### Epic 7 — shared automatic and manual release orchestration

Status: Corrected locally on 2026-08-23; production Environment secrets were
empirically unavailable inside the reusable deploy job despite two approved
attempts. A reviewed `main` run must validate the direct protected deploy job.

Goal: automatically prepare a verified `main` digest for production approval
while retaining one protected manual full-SHA recovery path and one deployment
implementation.

Tasks:

1. **Complete locally — separate preparation from protected deployment.** An
   unprivileged job verifies the full `main` SHA, successful complete quality
   provenance, exact image digest, and current-candidate policy. It publishes
   the SHA and digest in the workflow summary before the protected job waits for
   approval.
2. **Complete locally — share candidate selection and constrain the deploy
   boundary.** The green `main` workflow and `workflow_dispatch` invoke the
   same reusable selection/policy implementation for a selected full SHA. The
   minimal audited SSH transport is duplicated only in the two direct protected
   jobs, avoiding a post-approval checkout or secret forwarding across the
   reusable-workflow boundary. Keep full-SHA action pinning and least-privilege
   workflow permissions.
3. **Complete locally — retain the human production gate.** Only the deployment job
   references Environment `production`. It remains restricted to `main`,
   prevents self-review, requires `iShavlovsky`, and receives SSH secrets only
   after approval. Rejection or expiry makes no VPS call.
4. **Complete locally — harden manual recovery.** Accept only a lowercase 40-character
   SHA reachable from `main`; prove its image came from a successful complete
   quality run; reject arbitrary tags, raw user-supplied digests, legacy
   unverified candidates, and the incompatible `wget` release.
5. **Complete locally — serialize and audit releases.** Keep one non-cancelling
   `production-release` critical section on the direct deployment jobs, show
   the selected SHA/digest in the summary, and preserve GitHub deployment
   history without logging keys, credentials, host-key material, or registry
   tokens.
6. **In progress — validate the corrected protected boundary and close with
   full testing and documentation.** The first automatic preparation run
   [`32595571596`](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/32595571596)
   stopped before the production approval because the verified candidate SHA
   was not passed from its artifact parser to the release-policy step. Export
   and pass that SHA without changing `ci.yml`. Two later approved attempts
   reached the reusable deployment job but received empty Environment-secret
   values, including after both secrets were re-saved through `gh`. Move only
   the protected deployment jobs to the top-level callers, then run the
   complete Epic 7 exit gate. The reviewed `main` run must reach the protected
   approval job; do not approve or deploy as part of this task.

Acceptance: a green `main` revision automatically reaches a waiting production
approval with its exact tested digest visible; approval is still mandatory;
manual recovery cannot bypass provenance; both paths share the same candidate
selection/policy; and the complete Epic 7 exit gate passes.

Local evidence 2026-08-22: `.github/workflows/release.yml` remains the manual
`workflow_dispatch` entry point, but now calls the new shared
`production-release.yml`; the new `prepare-production-release.yml` calls that
same workflow only after successful `verify production candidate`. The shared
preparation job requires a lowercase full SHA reachable from `main`, a matching
successful `quality` push, one unexpired candidate evidence artifact, the exact
candidate digest, and matching OCI source/revision labels. Automatic releases
also reject a SHA superseded by current `main`; manual recovery may select an
older reachable SHA only when all of the same provenance evidence remains
available. The known incompatible `wget` digest is rejected. The protected
deployment job declares `production`, so its SSH secrets are unavailable during
preparation and are released only after the existing Environment approval.
`production-release` remains non-cancelling. Focused policy cases cover valid
automatic/manual requests, stale automatic candidate, failed quality, digest
and OCI mismatch, legacy image, and malformed SHA; actionlint, ShellCheck and
the current GitHub API evidence lookup pass. No workflow dispatch, Environment
approval, SSH connection, or VPS mutation occurred. A reviewed `main` run is
still required to prove the automatic path reaches the protected approval job.

Live diagnostic 2026-08-23: the first automatic preparation run
[`32595571596`](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/32595571596)
verified ancestry, candidate evidence, quality provenance, immutable digest,
and OCI labels, then stopped in `Apply release policy` before Environment
approval. Its artifact parser had validated that `revision` equalled the
selected SHA but exported only the digest and quality-run ID. The policy
correctly failed closed because its required `CANDIDATE_REVISION` input was
empty. The corrective change exports that already verified artifact field and
passes it to the same policy; it neither modifies `ci.yml` nor adds permissions,
secrets, VPS access, retries, or another release path. Live approval evidence
remains pending a reviewed merge and green post-merge runs.

Correction verification 2026-08-23: on Node `24.16.0`, task intake,
clone-contour, formatting, typecheck, lint, style lint, slop scan, 42 unit
tests, all deployment policy/Compose/status fixtures, build, generate, E2E
(25 passed, 5 expected skips), Lighthouse, static-container smoke, dependency
and cycle checks, dead-code, secret scan, actionlint, ShellCheck, shell syntax,
and diff checks passed. Existing lint warnings in unrelated UI components
remain warnings only. No workflow dispatch, Environment approval, SSH
connection, or VPS mutation occurred.

Environment-boundary correction 2026-08-23: both Environment secrets were
re-saved through `gh` from their local sources, and GitHub reported their
updated metadata. Nevertheless, the initial and re-run attempts of approved
automatic release `32626473239` reached `Configure approved SSH transport`
with both `DEPLOY_SSH_KNOWN_HOSTS` and `DEPLOY_SSH_PRIVATE_KEY` empty. The
first non-empty assertion failed before either SSH configuration or a VPS
connection, so the server was not mutated. The shared reusable workflow now
does only unprivileged candidate preparation and declares explicit `eligible`
and `image_ref` outputs. Each top-level caller owns a direct `production`
deployment job that consumes its own Environment variables and secrets after
approval, uses the existing strict SSH command and digest-only wrapper, and
joins the same non-cancelling `production-release` group. The two small inline
transport copies are deliberate: a helper script or action would require a
post-approval checkout, and `secrets: inherit` would broaden the secret
boundary. No repository deploy key, repository-level secret, `ci.yml` change,
new dependency, or VPS action is part of this correction. Local static and
full-gate evidence passed on Node `24.16.0`: task-intake and clean-clone
contour checks, formatting, typecheck, lint, style lint, slop scan, 42 unit
tests, candidate/release policy fixtures, Compose/status fixtures, dependency
and cycle checks, dead-code, build, generate, Playwright (25 passed, 5 expected
skips), Lighthouse, static-container smoke, secret scan, actionlint, ShellCheck
(with the pre-existing unrelated `SC2034` retry-counter warning excluded),
shell syntax, and diff checks. Only a reviewed later `main` run can prove GitHub
injects the Environment secrets into this direct job.

### Epic 8 — deployment, rollback, and public acceptance tests

Status: Pending Epic 7 acceptance.

Goal: prove the least-privilege VPS boundary, automatic failure recovery, and
public post-deploy behaviour before activating the new production path.

Tasks:

1. **Pending — test the root-owned wrapper as a public boundary.** Add portable
   shell harnesses with stubbed Docker, Compose, curl, and time boundaries for
   valid rollout, invalid digest, missing config, pull failure, Caddy failure,
   health timeout, first-release failure, rollback success, and rollback
   failure. Test that the forced SSH command rejects extra or altered commands.
2. **Pending — add external post-deploy smoke.** From the GitHub runner verify
   trusted HTTPS, HTTP redirect, `/`, `/privacy-policy`, `/robots.txt`,
   `/sitemap.xml`, a hashed asset, security/cache headers, canonical origin, and
   a genuine 404 after the wrapper reports success.
3. **Pending — bind smoke to release state.** Confirm the wrapper output and
   read-only status seam identify the exact approved digest as current. A smoke
   failure must fail the deployment visibly and invoke only the documented
   compatible recovery path.
4. **Pending — prove least privilege.** Recheck strict known hosts, forced-key
   behaviour, exact sudo rule, absence of Docker-group membership, and the fact
   that Actions cannot edit root-owned runtime files, reboot the host, or open a
   shell.
5. **Pending — close the epic with full testing and documentation.** Run the
   complete Epic 8 exit gate plus all wrapper negative cases; record evidence
   and present the diff before commit or production activation.

Acceptance: the wrapper and SSH boundary have deterministic success and failure
coverage; external smoke verifies the public site and exact digest; no Actions
privilege is widened; compatible rollback is automatic on failure; and the
complete Epic 8 exit gate passes.

### Epic 9 — production activation, rollback rehearsal, and handoff

Status: Pending Epic 8 acceptance and separate production approval.

Goal: activate the automatically prepared release path on the live host, prove
human approval and compatible rollback end to end, and leave a concise operator
handoff.

Tasks:

1. **Pending — run production preflight.** Confirm image A remains healthy and
   is the compatible rollback target; capture status, DNS/TLS, public smoke,
   Docker/restart state, disk/memory/process baseline, firewall policy,
   Environment reviewer and branch policy, and provider-console recovery.
2. **Pending — activate through a reviewed merge.** After owner review and
   explicit commit/push approval, merge the automation change normally. Require
   every post-merge job and exact-digest smoke to pass, then confirm the
   automatic release waits at Environment `production` without contacting the
   VPS.
3. **Pending — approve and verify image B.** The reviewer compares the visible
   SHA and digest with the successful pipeline and approves the deployment.
   Verify wrapper success, exact current digest, complete external smoke,
   container health, stable process count, and absence of secret leakage. A
   short single-container interruption is accepted.
4. **Pending — rehearse `B -> A` through manual recovery.** Select only the
   recorded known-good image A SHA using the protected manual path, approve it,
   and repeat exact status, health, TLS, route, SEO, header, cache, and 404
   checks. Do not return to the incompatible `wget` digest.
5. **Pending — prove restart persistence.** With separate owner approval, use
   the provider control panel for one normal reboot. Verify SSH, firewall,
   Docker, healthy container, Caddy volumes/TLS, release status, and public
   smoke after boot; do not grant Actions reboot permission.
6. **Pending — hand off and close.** Record the minimal normal-release, approval,
   rejection, retry, rollback, credential-rotation, and provider-recovery
   instructions plus workflow URLs, SHAs, digests, and non-secret evidence.
   Run the complete Epic 9 exit gate. Update the ADR and this roadmap to final
   observed behaviour; commit only after owner review. Source-host retirement
   remains a separate decision.

Acceptance: an eligible `main` revision automatically waits for production
approval, the exact digest deploys only after approval, public acceptance
passes, manual recovery proves `B -> A`, reboot persistence passes, and no
staging, branch-rule change, widened privilege, secret exposure, or source-host
retirement occurs.

Package decision: the MVP needs no new npm or runtime orchestration library.
Existing Bash, Docker/Compose, GitHub Actions, `actionlint`, ShellCheck, curl,
and the project test commands cover the required seams. Image attestations or a
workflow security scanner may be proposed later as a separate hardening task;
they do not solve the current health, gating, artifact-parity, or rollback gaps
and are not part of Epics 5–9.

Planning record on 2026-08-18: branch `codex/automatic-production-deploy` was
created from current `origin/main` at
`f4965680b32cb28ec9a11f8b6ee512a25d3dd1d2`; no rejected PR #9 commit was
reused. Read access confirmed that `ghcr.io/conspiracy-dev/deploy-lab` remains
private and contains immutable SHA-tagged versions, including that `main`
revision. Task-intake, formatting, contour, secret, and diff checks passed on
Node 24.16.0 and pnpm 11.5.2. Only this roadmap and the existing VPS ADR were
changed; no commit, push, GitHub setting, workflow run, image, Environment, or
VPS state was changed.

Access decision recorded on 2026-08-18: future approved owner maintenance will
use a local SSH alias backed by the workstation SSH Agent. The repository will
not contain the alias or key. Recording the choice did not start Epic 5, open an
SSH connection, inspect the host, or authorise any production command.

## Verification

### Full exit gate for every Epic 5–9

An epic is not complete when only its focused test passes. Before proposing
closure, run the following on the project Node 24 and pnpm 11.5.2 toolchain,
read every result, update this roadmap with real evidence, and stop on failure:

1. `pnpm task:intake:check --file docs/plans/vps-deployment.md` and
   `pnpm contour:doctor:clone`.
2. `pnpm format:check`, `pnpm quality:static`, `pnpm build`, and
   `pnpm generate`.
3. `pnpm test:deployment:status` and every deployment-focused test present in
   `package.json`, including production Compose and wrapper tests once added.
4. `pnpm test:e2e`, `pnpm lighthouse`, and `pnpm test:docker:smoke`.
5. `pnpm deps:check`, `pnpm deps:cycles`, `pnpm dead-code`, and
   `pnpm secrets:check`.
6. `actionlint .github/workflows/*.yml`, ShellCheck for every deployment shell
   file, and shell syntax checks.
7. The epic-specific negative and production-shaped tests listed under that
   epic. A real PR run must keep every existing check green and must not publish
   or request production approval.
8. `git diff --check` and `git status --short`; inspect the complete diff and
   preserve unrelated work.

Production acceptance supplements this local and CI gate; it never replaces
it. No epic may be marked complete, committed, pushed, dispatched, or used to
mutate the VPS merely because a narrower check passed.

### Epic 0 evidence to collect

1. `pnpm task:intake:check --file docs/plans/vps-deployment.md`.
2. `pnpm format:check`.
3. `pnpm quality:static` on Node 24.16.0 and pnpm 11.5.2.
4. `pnpm secrets:check`, `pnpm contour:doctor`, `git diff --check`, and
   `git status --short`.

Epic 0 changes neither rendered UI nor production runtime behaviour. The full
project gate was nevertheless run before closing the epic. Epics 5–9 repeat the
full exit gate above and add their focused health, artifact, workflow, public
acceptance, and rollback proof.

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

### Epic 3 evidence

Recorded 2026-08-13: the VPS completed its package repair/update and reboot;
`dpkg --audit` was clean, fresh SSH key authentication worked, and Docker Engine
29.7.2 with Compose 5.4.0 was installed from Docker's Ubuntu repository.
`docker info` reports the `local` logging driver. The production Caddyfile
validated against the pinned Caddy image, and production Compose validated with
an intentionally non-existent but syntactically correct immutable image digest.
No application container was created.

The Caddy/Compose files and deployment scripts were installed root-owned under
`/opt/deploy-lab` and `/usr/local/sbin`. A non-existent GHCR digest reached
Compose validation then was denied by the registry, returning the expected
wrapper failure without starting a service. The forced Actions key rejected an
arbitrary command; the owner key remained an unprivileged `deployer` login;
both could reach only the validated deployment boundary. `visudo -c` and
`sshd -t` passed. UFW is active with only 22/80/443 allowed, root SSH and all
password/KbdInteractive SSH are denied, external SSH succeeds, and Docker TCP
2375 is closed.

The GitHub `production` Environment has `PRODUCTION_HOST=138.124.85.193` and
`PRODUCTION_SSH_USER=deployer`, plus the deploy private key and verified
`known_hosts` as Environment secrets. `release.yml` now writes these secrets
only to the ephemeral GitHub runner and invokes the digest-only wrapper with
strict host-key verification. `actionlint`, shell parsing, local Caddy
validation, and production Compose validation pass. The owner confirmed the
provider firewall and performed a forced reboot. Afterwards SSH by the owner
key returned, the restricted wrapper reached Docker and the registry, TCP 22
remained reachable, TCP 80/443 remained closed before an application release,
and root SSH remained denied. Epic 3 is complete. Caddy volume recreation will
be exercised only when the first published application image starts in Epic 4.

### Epic 4 evidence

Recorded 2026-08-15: target `194.87.83.103` was patched, rebooted, and verified
on kernel `6.8.0-137-generic`. `iptables-persistent` survived reboot with
default-deny INPUT and `DOCKER-USER` policies; TCP 22, 80, and 443 are public,
while TCP 10050 did not answer a non-whitelisted external client. Zabbix remains
enabled for only `92.53.116.12`, `92.53.116.111`, and `92.53.116.119`.
`docker info` reports the bounded `local` logging driver. The root-owned
`/etc/docker/daemon.json` is represented by
`infra/production/docker-daemon.json` so the operational logging policy is
reviewable without storing host credentials.

The target Caddy/Compose/wrapper validation passed; the owner `deployer` key
worked; a fresh forced Actions key rejected an arbitrary command; and root SSH
was rejected after `sshd -t` and SSH reload. Root Docker authenticated to the
private registry with an owner-supplied `read:packages` token and pulled the
exact digest. GitHub Environment values and target known hosts were replaced,
then approved release run `31884433096` completed successfully.

Public acceptance pinned `noash.net` SNI to `194.87.83.103` because the local
Mac resolver still cached the old record: trusted HTTPS returned 200 for `/`,
`/privacy-policy`, `/robots.txt`, and `/sitemap.xml`; HTTP redirected with 308;
the unknown route returned 404; HSTS, referrer, permissions, and nosniff headers
were present; and `/_nuxt/DU7F4wyR.js` returned a one-year immutable cache
header. Public resolvers `1.1.1.1` and `8.8.8.8` returned the target A record;
no AAAA record or `www` change was observed. Rollback rehearsal and source-host
retirement are intentionally deferred to Epic 5.

## Risk and stop condition

- Do not commit or push this branch until the owner reviews the proposed diff
  and explicitly authorises that delivery action. Do not merge, dispatch a
  release, approve a deployment, change GitHub settings, or mutate the VPS by
  inference from an earlier approval.
- Do not inspect the SSH alias, connect to the host, or run even read-only VPS
  commands until the owner explicitly starts the relevant epic and approves the
  command scope. Never print, copy, persist, or request the private key.
- Do not enable automatic production preparation until Epic 5 establishes a
  compatible healthy image A. Never use the former `wget` digest as a normal
  rollback target after production Compose requires `curl`.
- Stop on a health diagnosis that contradicts the recorded `wget` evidence, a
  host-key mismatch, unavailable owner/provider recovery access, invalid
  root-owned configuration, failed exact-image validation, failed health or
  public smoke, wrong canonical origin, unexpected release state, or secret in
  output. Ask the owner rather than bypassing the failed control.
- All existing quality checks must retain their behaviour and thresholds. Do
  not add skips, retries that conceal failure, `continue-on-error`, weaker
  Lighthouse/Playwright assertions, broader token/SSH/sudo permissions, or a
  second deployment path to make the pipeline green.
- Branch protection and rulesets remain unchanged by owner decision. The team
  lead owns MR review; a successful direct `main` push can still reach the
  production approval queue. If this operating policy changes, amend the ADR
  before changing workflow eligibility.
- Environment approval remains mandatory. A reviewer must be able to compare
  the candidate SHA and digest with the successful pipeline before production
  secrets are released.
- No new package is added unless an epic exposes a concrete gap that existing
  Bash, Docker/Compose, GitHub Actions, actionlint, ShellCheck, curl, and project
  tests cannot cover. Present such a dependency and its trade-offs for approval
  first.
- Update this roadmap and the ADR when an epic changes state. Record observed
  workflow URLs, SHAs, digests, and non-secret test evidence; do not create a
  separate status document.
- Do not change `www.noash.net`, registry visibility, source-host retention,
  monitoring, DNS shape, or the no-staging decision inside this roadmap.
