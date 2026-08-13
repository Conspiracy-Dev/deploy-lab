# ADR: VPS static deployment architecture

- **Status:** Accepted
- **Date:** 2026-08-13
- **Decision owner:** Igor Shavlovsky

## Context

DeployLab is a static Nuxt 4 site: `pnpm generate` creates the deployable
`.output/public` directory and the application has no runtime database, API,
user uploads, or functional form delivery. The production host is VPS
`138.124.85.193`, verified as an otherwise clean Ubuntu 24.04 amd64 instance
with one vCPU, 961 MiB RAM, 6.7 GiB free disk space, and free TCP ports 80 and 443. Docker is not installed yet.

The canonical domain has not been supplied. `NUXT_PUBLIC_SITE_URL` is a
build-time contract for canonical links, `robots.txt`, and the sitemap, so a
production image cannot be accepted before it is rebuilt with the final
`https://<domain>` value.

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
   public GitHub Container Registry package `ghcr.io/ishavlovsky/deploy-lab`
   only after the owner supplies `PRODUCTION_SITE_URL`. The package is linked to
   this repository through OCI source metadata. The server pulls anonymously
   and holds no GitHub token. No placeholder origin is published because it
   would make canonical links, `robots.txt`, and the sitemap incorrect.
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
- The public GHCR package permits anonymous image pulls. Its visibility must be
  confirmed after first publication because changing a package to public cannot
  be reversed to private.
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

Epic 2 implementation began on 2026-08-13. Workflow actions are pinned to
verified full commit SHAs; pull requests gain a static-container smoke job; and
a manual SHA/digest selection workflow is concurrency-protected and references
the future `production` Environment. `actionlint` is installed locally through
Homebrew. No workflow has been pushed or run from `main`; no GHCR package,
public registry visibility, Environment, secret, GitHub setting, VPS call, or
production release has been created. Those external steps remain blocked on the
repository owner `iShavlovsky` and the final canonical domain.
