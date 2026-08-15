# ADR: VPS static deployment architecture

- **Status:** Accepted
- **Date:** 2026-08-13
- **Decision owner:** Igor Shavlovsky

## Context

DeployLab is a static Nuxt 4 site: `pnpm generate` creates the deployable
`.output/public` directory and the application has no runtime database, API,
user uploads, or functional form delivery. The production host is VPS
`138.124.85.193`, verified as an Ubuntu 24.04 amd64 instance with one vCPU,
961 MiB RAM, and 6.7 GiB free disk space before Docker installation.

The canonical domain is `noash.net`; its public A record resolves to
`138.124.85.193`, and it has no AAAA record. `NUXT_PUBLIC_SITE_URL` is a
build-time contract for canonical links, `robots.txt`, and the sitemap, so a
production image must be rebuilt with `https://noash.net`. The unrelated
`www.noash.net` A record currently resolves to a different address and is not
part of this release without a separate redirect decision.

## Decision

1. Production uses one static Caddy container. It serves only Nuxt's generated
   `.output/public`, performs HTTP-to-HTTPS redirects, obtains TLS
   certificates automatically, and keeps Caddy's `/data` and `/config` in
   persistent Docker volumes. A Node/Nitro runtime, database, Kubernetes,
   Certbot, and a second reverse proxy are not part of v1.
2. The image uses a multi-stage build: Node `24.16.0` and pnpm `11.5.2` on a
   Debian-based builder run `pnpm generate`; the runtime uses a pinned official
   Caddy image. The final image contains only static output and Caddy
   configuration. The verified runtime-image digest is
   `sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d`.
3. GitHub Actions verifies the static container on pull requests and publishes
   an immutable `linux/amd64` image for each full `main` commit SHA to the
   private GitHub Container Registry package `ghcr.io/conspiracy-dev/deploy-lab`
   only after the owner supplies `PRODUCTION_SITE_URL`. The package is linked to
   this repository through OCI source metadata. The release workflow logs in
   with its ephemeral `GITHUB_TOKEN` before resolving a digest. The VPS uses a
   separate `read:packages` credential available only to root Docker; the
   unprivileged `deployer` account, source repository, image, Compose files,
   and normal environment variables never receive it. No placeholder origin is
   published because it would make canonical links, `robots.txt`, and the
   sitemap incorrect.
4. Production rollout is manual. A `workflow_dispatch` release job accepts a
   full SHA from `main`, runs in GitHub Environment `production`, and requires
   approval by `iShavlovsky` before it receives deployment secrets. Automatic
   deployments from `main` are not enabled.
5. The VPS receives an unprivileged `deployer` user and a narrowly scoped
   root-owned deployment wrapper. The wrapper accepts only an immutable image
   digest, preserves the prior digest, verifies Compose and HTTP smoke checks,
   and returns to the prior digest when a rollout fails. The user is not added
   to the Docker group.
6. After a verified second SSH key login and rescue-console confirmation, the
   VPS disables SSH password authentication and root login. Its firewall permits
   only TCP 22, 80, and 443. Docker's packet-filtering rules are inspected as
   part of this work because published ports can bypass ordinary UFW handling.
7. The first release uses direct DNS: one A record for the final domain points
   to `138.124.85.193`. No AAAA record or `www` alias is created without a
   separate decision. Caddy begins public TLS only after DNS resolves publicly.
8. Caddy returns the generated `404.html` with HTTP 404, uses long-lived cache
   headers only for hashed Nuxt and font assets, and does not add a second CSP:
   Nuxt's static pages already contain page-specific CSP metadata. HTTP security
   headers that static Nuxt cannot emit are set at Caddy.
9. A single-container update may make the site unavailable for a few seconds.
   This is accepted for v1. Zero-downtime slots, off-host backup, monitoring,
   and alerts are deferred until the site has mutable data or an explicit
   availability requirement.

## Consequences

- Releases are reproducible from a Git SHA and can be rolled back to the
  previously recorded image digest without rebuilding on the VPS.
- `NUXT_PUBLIC_SITE_URL` must be passed while building the production image;
  changing a runtime environment variable cannot repair published SEO URLs.
- The VPS needs only Docker, Compose, the deployment wrapper, and Caddy state;
  it does not receive source code or Node build dependencies.
- The private GHCR package requires authenticated pulls. The owner maintains a
  dedicated credential limited to `read:packages`, revokes it on compromise,
  and rotates it through a controlled root-only VPS login; it is not a GitHub
  Actions secret because Actions uses its ephemeral workflow token.
- Caddy certificate state remains persistent but is not a source of application
  data. Git and GHCR are the recovery sources for code and releases.

## Implementation record

Epic 0 completed on 2026-08-13. The deployment branch was created from
`origin/main`; repository and VPS discovery, this ADR, and the live roadmap
were completed. The full project gate passed: build, static generation and link
checking, Playwright, Lighthouse, dependency analysis, secret scanning, and
repository checks. No Docker package, server configuration, GitHub Environment,
registry package, DNS record, or production deployment has been changed. The
detailed execution status and verification evidence live in
`docs/plans/vps-deployment.md`.

Epic 1 completed on 2026-08-13. It introduced the reproducible Node-to-Caddy
image, loopback-only local Compose configuration, response smoke test, and global
Google font provider. The image was verified locally and for `linux/amd64`; no
VPS, DNS, registry, GitHub Environment, or production service was changed.

Epic 2 implementation began on 2026-08-13. The repository was transferred to
the `Conspiracy-Dev` organization; the OCI namespace is therefore
`ghcr.io/conspiracy-dev/deploy-lab`. Workflow actions are pinned to
verified full commit SHAs; pull requests gain a static-container smoke job; and
a manual SHA/digest selection workflow is concurrency-protected and references
the `production` Environment. `actionlint` is installed locally through
Homebrew. The repository now enforces full-SHA action pinning and has a
read-only default workflow token; its `production` Environment accepts only
`main`, requires review by `iShavlovsky`, and prevents self-review. No workflow
has been pushed or run from `main`; no GHCR package, public registry visibility,
secret, VPS call, or production release has been created. Those external steps
remain blocked on an approved push to `main`. Repository variable
`PRODUCTION_SITE_URL` is set to `https://noash.net`; no image was published as
a result.

Epic 3 implemented the production host boundary on 2026-08-13. Ubuntu security
updates were repaired and applied, then the VPS was rebooted and key access was
rechecked. Docker Engine 29.7.2 and Compose 5.4.0 were installed from Docker's
official Ubuntu repository with the bounded `local` logging driver. The host
now holds only root-owned runtime files under `/opt/deploy-lab`, a digest-only
rollback wrapper, persistent Caddy volumes, and the dedicated `deployer`
account; it has no repository checkout, Node toolchain, or GitHub credential.
The previously empty `/etc/sudoers` file was restored to a minimal valid policy
with `/etc/sudoers.d` included before the constrained `deployer` rule was
enabled. SSH root and password authentication are disabled after independent
owner and Actions-key tests; UFW permits only TCP 22, 80, and 443.

The protected `production` Environment now stores the Actions private deploy
key and the verified server `known_hosts` value, plus non-secret host and user
variables. The manual workflow copies those values only into the ephemeral
runner SSH directory and can request the server wrapper with the resolved
digest. No GHCR application image exists, no site container has been started,
and no DNS or `www` change was made. The owner confirmed the provider firewall
and performed a forced reboot; owner-key SSH, the restricted wrapper, and its
Docker registry path returned successfully afterwards. Epic 3 is complete.
Caddy volume recreation remains a first-release runtime check because no
application image exists yet.

Epic 4 private-registry correction started on 2026-08-15. The first approved
release run correctly found the immutable image but attempted its GHCR digest
lookup anonymously and received HTTP 401. The architecture now intentionally
keeps the package private: the release workflow authenticates with its scoped
ephemeral `GITHUB_TOKEN`, while the VPS will receive a separate root-only
credential limited to `read:packages`. A repository deploy key is not used for
registry access. The remaining first-release blocker is owner provisioning of
that credential directly on the VPS; no token value is recorded here or in the
repository.
