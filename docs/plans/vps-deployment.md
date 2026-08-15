# VPS deployment plan and roadmap

Status: Epic 0–4 complete; production live on `194.87.83.103`

Last updated: 2026-08-15

## Goal

Deploy the static DeployLab site to target VPS `194.87.83.103` through a reproducible,
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
- Deploy before Epic 3 prepares and hardens the VPS.
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
  one Caddy runtime container, and a manually approved production workflow.
  The release job uses its ephemeral `GITHUB_TOKEN` for GHCR reads; the VPS
  will use a distinct root-only credential limited to `read:packages`.
- `f7one` and `iShavlovsky` have repository `admin` access. `iShavlovsky` is
  the selected GitHub Environment production reviewer. Target hardening used
  independently verified owner and Actions SSH paths; provider-console access
  was not required.
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

### Epic 5 — rollback rehearsal and handoff

Status: In progress — the release-status seam and Zabbix ingress restriction
are installed and verified on the target. The protected production exercise is
paused at preflight because the live container reports `unhealthy`; its
corrective image must be reviewed, merged, and published before any forward
release, return, or provider reboot.

Goal: prove that a future approved immutable release can be returned to the
currently live immutable digest through the same protected release workflow,
then hand over only the commands and evidence needed for normal operation.

Non-goals: do not retire, erase, reboot, or otherwise alter source VPS
`138.124.85.193`; add an availability platform; widen GitHub, Docker, or SSH
privileges; expose registry credentials; or make a deliberately broken public
release. This is a controlled release-and-return exercise, not a failure drill.

Execution order for the remaining work:

1. **Pending — select the corrected forward-release candidate.** Revision
   `f4965680b32cb28ec9a11f8b6ee512a25d3dd1d2` was selected and published by
   successful workflow run `31897848202`, but preflight found a healthcheck
   defect in that image. The candidate is therefore superseded: use the next
   full `main` SHA that contains the `curl` healthcheck correction and has
   completed the normal private-GHCR publication workflow. It must differ from
   live revision
   `e6a7a52ac1f6f9a1b183a982e6d2e873a5fd9776`; the current release digest
   `sha256:8891c68e54ab1c6423a1e277394dc38996b260f523d3bb3e5c31dacef1f742f7`
   is recorded as the return target. Do not invent an application change merely
   to create a candidate; if no legitimate next revision exists, use an
   owner-reviewed operational change that still publishes a new immutable image.
2. **Complete — add a read-only release-status seam.** The tested repository
   command is installed as a root-owned
   `deploy-lab-status` command that prints only the current and previous image
   digests from `/var/lib/deploy-lab`, with no registry credential or mutable
   environment data. Permit this exact command to the owner `deployer` user in
   sudoers; it remains unavailable to the forced Actions key. Add a focused
   shell test for empty, first-release, two-release, and malformed state. CI
   runs the test before publishing a candidate image. On 2026-08-15, an
   approved privileged provider-console session installed the `1004`-byte
   script at `/usr/local/sbin/deploy-lab-status`, owned by `root:root` with
   mode `0755`, and installed `/etc/sudoers.d/deploy-lab-status` with mode
   `0440`. `visudo -cf` returned `parsed OK`; an execution as `deployer`
   returned only the expected `CURRENT` and `PREVIOUS` digest values. This
   allows an operator to identify the live digest without root shell access.
3. **Pending — preflight and baseline.** Before changing the live image, record
   status output, `docker compose ps`, Docker/restart policy, current TLS
   certificate, and public smoke results for `/`, `/privacy-policy`,
   `robots.txt`, `sitemap.xml`, one hashed asset, and a genuine 404. Confirm the
   protected Environment still requires review and target DNS resolves publicly
   to `194.87.83.103`; stop on any regression.

   Preflight evidence on 2026-08-15: the read-only status command returned the
   live digest as both `CURRENT` and `PREVIOUS`; Docker was enabled and active;
   the `deploy-lab-site-1` container was `running` with
   `restart=unless-stopped`, but its Docker health state was `unhealthy`.
   `DOCKER-USER` permits only forwarded TCP 80/443 before its terminal DROP.
   Public HTTPS route, TLS, header, cache and 404 checks passed from the owner
   workstation, and the GitHub `production` Environment retains required
   review. A localhost HTTPS probe on the VPS returned `HTTP/2 200` with the
   expected security and cache headers. The exercise is deliberately stopped:
   Docker's five most recent healthcheck attempts all failed before executing
   the command with `OCI runtime exec failed: ... procReady not received`, so
   the container is still marked `unhealthy`; direct `docker exec` reproduces
   the same failure and Docker logs show the accompanying closed-FIFO errors.
   Kernel logs identify a cgroup pids-controller fork rejection in the site
   container's Docker scope. The scope has no configured PID limit, but the
   host contains 1096 `ssl_client` processes. This is the documented BusyBox
   `wget` HTTPS zombie leak triggered by the existing healthcheck. The next
   operational image replaces that probe with `curl`; its normal protected
   deployment will recreate the container and remove the leaked process tree.
   No manual `kill`, Docker restart, or direct container replacement is used.
   `ufw` is not installed, but raw INPUT
   policy is default-DROP and permits TCP 10050 only from `92.53.116.12`,
   `92.53.116.111`, and `92.53.116.119`; Zabbix restriction is verified. The owner
   workstation's `dig` replies in `198.18.0.0/15` are synthetic answers from a
   local fake-IP DNS/TUN proxy (the same range was returned for Joker's name
   servers), not authoritative DNS data. Independent Cloudflare and Google
   DNS-over-HTTPS lookups both returned the expected `194.87.83.103`; the Joker
   DNS control panel also records that A value. The corrective image adds
   `curl` to the final Caddy image and uses a SNI-correct localhost probe. A
   regression test rejects the former `wget --spider` probe and validates the
   compose file with representative required variables. No release is
   dispatched until that corrective image is reviewed, merged, and published.

4. **Pending — controlled forward release.** Dispatch the manual production
   release workflow for the corrected selected SHA, obtain normal `production` approval, and wait
   for the digest-only wrapper to declare it healthy. Re-run public smoke and
   status; prove that `current` is the candidate digest and `previous` is the
   original live digest. A brief single-container interruption is accepted.
5. **Pending — controlled return through the same workflow.** Dispatch the
   same protected workflow for the original full SHA
   `e6a7a52ac1f6f9a1b183a982e6d2e873a5fd9776`; do not use direct Docker commands
   or edit state files. After approval, verify `current` equals the original
   digest and `previous` equals the candidate. Repeat the complete public smoke,
   TLS, header, cache, and 404 checks.
6. **Pending — restart persistence.** The owner performs one normal reboot from
   the VPS provider control panel after the return release. Do not grant
   `deployer` permission to reboot. Verify SSH availability, netfilter policy,
   Docker service, Caddy container health, persistent certificate state, status
   output, and public HTTPS smoke after boot. If no provider reboot control is
   available, stop and request a supported recovery/reboot path; do not weaken
   SSH hardening to work around it.
7. **Pending — handoff and closure.** Add concise normal deploy, return, status,
   credential-rotation, and recovery instructions to this roadmap; record both
   workflow URLs, SHAs, digests, restart evidence, and test results without
   secrets. Run formatting, static quality, deployment-shell tests, secret scan,
   and diff checks. Commit only after owner review. Do not start source-host
   retirement; that remains a separate owner decision after Epic 5.

Acceptance: an operator can identify the live and previous digests through the
read-only status command; a reviewed forward image and the original image each
reach production through the same approved workflow; the public site, TLS,
headers, caching, routes, 404, Zabbix restriction, and post-reboot persistence
all pass; and no source-host retirement or credential exposure occurs.

Repository evidence recorded 2026-08-15: `pnpm test:deployment:status`,
ShellCheck for the command and its test, Actionlint, `pnpm format:check`,
`pnpm quality:static` (42 unit tests), `pnpm deps:check`,
`pnpm deps:cycles`, and `pnpm test:docker:smoke` passed. The static quality
gate retains its 15 pre-existing ESLint warnings and no errors. No VPS state,
workflow dispatch, reboot, or source-host retirement was performed by this
repository change.

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

- Do not begin Epic 2 until the owner reviews and explicitly approves the Epic 1
  implementation and its local commit.
- Do not publish an IP-based site with placeholder canonical URLs. Do not serve
  `www.noash.net` until its DNS and redirect policy are explicitly approved.
- Stop a VPS rollout immediately on host-key mismatch, failed second SSH login,
  invalid SSH configuration, occupied 80/443, failed image validation,
  failed health/smoke check, or wrong canonical origin; retain or restore the
  prior digest.
- Do not modify GitHub environments, registry visibility, Docker packages,
  firewall, SSH, DNS, or production services as part of Epic 0.
- Do not push this branch. Later-epic commits require owner review and explicit
  authorisation.
