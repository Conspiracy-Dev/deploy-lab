# ADR: VPS static deployment architecture

- **Status:** Accepted
- **Date:** 2026-08-13
- **Last amended:** 2026-08-22
- **Decision owner:** Igor Shavlovsky

## Context

DeployLab is a static Nuxt 4 site: `pnpm generate` creates the deployable
`.output/public` directory and the application has no runtime database, API,
user uploads, or functional form delivery. VPS `138.124.85.193` is the source
host: it was prepared and hardened but has no deployed application. The target
production host is VPS `194.87.83.103`; it is the live production host after
the 2026-08-15 migration. The source remains retained and untouched pending an
explicit retirement decision.

The canonical domain is `noash.net`; its public A record resolves to
`194.87.83.103`, and it has no AAAA record. `NUXT_PUBLIC_SITE_URL` is a
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
3. GitHub Actions verifies pull requests and repeats the complete quality suite
   for every `main` revision. The existing `quality` workflow, including its
   configured publication job and its checks, is an owner-protected boundary and
   must not be changed by the automatic-deployment work. It publishes an
   immutable `linux/amd64` image for the full commit SHA to the private GitHub
   Container Registry package `ghcr.io/conspiracy-dev/deploy-lab`. A separate,
   read-only workflow may run only after that `quality` workflow completes
   successfully for a `main` push; it resolves the existing digest and
   smoke-tests it before it can become a release candidate. The package is
   linked to this repository through OCI source metadata. The release workflow
   uses its ephemeral `GITHUB_TOKEN`; the VPS uses a separate `read:packages`
   credential available only to root Docker. The unprivileged `deployer`
   account, source repository, image, Compose files, and normal environment
   variables never receive that credential. No placeholder origin is published
   because it would make canonical links, `robots.txt`, and the sitemap
   incorrect.
4. A successful `main` pipeline automatically prepares a production release
   but does not deploy unattended. An unprivileged preparation job validates
   the revision and exposes its exact immutable digest. The protected deploy
   job then waits in GitHub Environment `production` for approval by
   `iShavlovsky`; production SSH secrets remain unavailable until that approval.
   The existing `workflow_dispatch` entry point remains as a protected recovery
   and rollback path. It uses the same release implementation, accepts only a
   full SHA from `main`, and must prove that the selected image came from a
   successful complete quality pipeline.
5. The VPS receives an unprivileged `deployer` user and a narrowly scoped
   root-owned deployment wrapper. The wrapper accepts only an immutable image
   digest, preserves the prior digest, verifies Compose and HTTP smoke checks,
   and returns to the prior digest when a rollout fails. The user is not added
   to the Docker group.
6. After a verified second SSH key login, the VPS disables SSH password
   authentication and root login. Its persistent packet-filter policy permits
   public TCP 22, 80, and 443; it retains Zabbix TCP 10050 only for
   `92.53.116.12`, `92.53.116.111`, and `92.53.116.119`. The target uses
   `iptables-persistent` rather than UFW because the installed packages conflict;
   Docker's `DOCKER-USER` chain is explicitly default-deny except for 80/443.
7. The release uses direct DNS: the final domain A record points to
   `194.87.83.103`. No AAAA record or `www` alias is created without a separate
   decision. Caddy begins public TLS only after DNS resolves publicly to the
   target.
8. Caddy returns the generated `404.html` with HTTP 404, uses long-lived cache
   headers only for hashed Nuxt and font assets, and does not add a second CSP:
   Nuxt's static pages already contain page-specific CSP metadata. HTTP security
   headers that static Nuxt cannot emit are set at Caddy.
9. A single-container update may make the site unavailable for a few seconds.
   This is accepted for v1. Zero-downtime slots, off-host backup, monitoring,
   and alerts are deferred until the site has mutable data or an explicit
   availability requirement.
10. Target-host migration is a rebuild, not a disk or Docker-state copy. After
    the owner authorizes target SSH access and records its host key,
    `194.87.83.103` receives the existing hardened
    runtime pattern with a fresh deployer/Actions SSH keypair, target-specific
    `known_hosts`, and its own root-only `read:packages` GHCR credential. Only
    after target validation GitHub Environment `production` replaces
    `PRODUCTION_HOST`, deploy key, and known-host values. The source
    host is retained unchanged until public acceptance and explicit owner
    retirement approval.
11. Operators identify release state through a root-owned, read-only status
    command that exposes only current and previous immutable image digests.
    The owner `deployer` account receives one exact sudo permission for that
    command; the forced Actions key does not. Installing or changing this
    root-owned command still requires an approved privileged maintenance path,
    rather than expanding deployment-key or `deployer` privileges.
12. Repository branch protection and rulesets are not part of this decision.
    The team lead reviews merge requests and owns merge discipline. GitHub
    Actions therefore treats any revision that reaches `main` and passes the
    complete post-merge suite as eligible to become a reviewed production
    candidate, including a direct push. This organisational control does not
    weaken the deployment gate: a failed or incomplete `main` pipeline cannot
    publish a candidate or reach the production approval job.
13. The live BusyBox `wget` HTTPS healthcheck must be replaced before automatic
    production preparation is enabled. The corrective image includes `curl`,
    production Compose uses the matching SNI-correct probe, and the root-owned
    VPS Compose file is updated only through approved owner maintenance access.
    The former `wget` image is retained for audit history but is not a normal
    rollback target. The first corrected image becomes known-good before a later
    release rehearses rollback to it.
14. Approved owner maintenance uses a preconfigured local SSH alias whose
    private key is already loaded in the workstation SSH Agent. No private key,
    alias value, agent socket, or SSH configuration is stored in the repository
    or copied into GitHub Actions. Possessing the local access path does not
    authorise a connection or command: every read-only audit, configuration
    mutation, release, and recovery action still requires its separately scoped
    owner approval. The dedicated `maintenance` account has owner-approved
    passwordless `sudo` for the current Epic 5 recovery and correction work;
    this access is separate from the `deployer` and forced Actions identities.
    The forced Actions key remains limited to the digest-only deployment wrapper.
15. Password authentication is disabled. The owner uses a dedicated
    `nikitazinevich_macbook` account and a separate Ed25519 key held in the
    workstation SSH Agent. This account receives no `NOPASSWD sudo` privilege.
    It is distinct from the emergency-maintenance and forced Actions identities;
    adding a personal key does not widen deployment or root authority.

## Consequences

- Releases are reproducible from a Git SHA and can be rolled back to the
  previously recorded compatible known-good image digest without rebuilding on
  the VPS. A runtime configuration migration must not roll back to an image
  that lacks the healthcheck command required by the installed Compose file.
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
- No Caddy volume, Docker credential, SSH private key, or host configuration is
  copied from source to target. The target obtains its own certificate after
  DNS cutover; this is safe because the site has no mutable runtime data.
- A production release is prepared automatically after a green `main` run, but
  a human still authorises the exact digest before deployment secrets are
  released. Rejecting or leaving that approval pending makes no VPS change.
- Merge-request enforcement remains an operating policy rather than a GitHub
  branch rule. A direct `main` push that passes all checks can also reach the
  production approval queue; the production reviewer remains the final human
  control for that accepted risk.

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

Epic 4 registry correction started on 2026-08-15. The first approved release
run attempted its GHCR digest lookup anonymously and received HTTP 401; the
corrected release workflow now authenticates with its scoped ephemeral
`GITHUB_TOKEN`. Its merged `main` run succeeded and published
`e6a7a52ac1f6f9a1b183a982e6d2e873a5fd9776` as
`sha256:8891c68e54ab1c6423a1e277394dc38996b260f523d3bb3e5c31dacef1f742f7`.
The owner rejected public package visibility because GitHub cannot restore a
public container package to private. The package therefore remains private; a
repository deploy key is not used. The provider console is currently
unavailable, so the remaining first-release blocker is HIP support restoring
root-console access. After that, the owner will provision the dedicated
root-only `read:packages` credential and verify an authenticated exact-digest
pull. No credential value is recorded here or in the repository.

VPS migration was selected on 2026-08-15: target `194.87.83.103` replaces
source `138.124.85.193` before the first production release. The owner
authorized the target SSH connection; its observed ED25519 fingerprint is
`SHA256:M6ZafTbhTX9vwa8CeZe8aucOsTz9sD8tGUZWUV6t5cI`. The old host remains
untouched; GitHub Environment, DNS, and application release configuration
changed only in the documented cutover sequence.

Target read-only audit on 2026-08-15 found Ubuntu 24.04.3 amd64, 961 MiB RAM,
8.9 GiB free disk, Docker Engine 29.1.4, Compose 5.0.1, and 63 pending package
updates. It also found root/password SSH enabled, inactive UFW, unbounded
Docker `json-file` logging, and an externally reachable Zabbix agent on TCP 10050. The owner chose to retain Zabbix and restrict it to its three configured
provider addresses before default-deny firewalling.

Epic 4 completed on 2026-08-15. The target was updated and rebooted onto
kernel `6.8.0-137-generic`; Docker Engine 29.7.2 and Compose 5.4.0 run with a
bounded `local` logging driver. Zabbix was retained and TCP 10050 is whitelisted
only for the three provider addresses in this ADR; a non-whitelisted external
connection times out. Target runtime files are root-owned, with a fresh Actions
key constrained to the digest-only wrapper and an owner `deployer` shell. The
observed ED25519 fingerprint
`SHA256:M6ZafTbhTX9vwa8CeZe8aucOsTz9sD8tGUZWUV6t5cI` is the value stored in the
production Environment `known_hosts` secret.

The owner supplied a root-only classic GitHub Packages credential limited to
`read:packages`; the exact private GHCR digest pull succeeded. GitHub
Environment `production` now targets `194.87.83.103` as `deployer`. Approved
release run `31884433096` deployed commit
`e6a7a52ac1f6f9a1b183a982e6d2e873a5fd9776` at digest
`sha256:8891c68e54ab1c6423a1e277394dc38996b260f523d3bb3e5c31dacef1f742f7`.
Public acceptance via the new IP and `noash.net` SNI passed: HTTP 308 to HTTPS,
trusted TLS, `/`, `/privacy-policy`, `robots.txt`, and `sitemap.xml` return 200,
an unknown path returns 404, immutable Nuxt assets have cache headers, and the
configured security headers are present. A local Mac resolver temporarily
retained the old A record; independent public resolvers already returned the
target. Epic 5 rollback rehearsal and source-host retirement remain pending.

Epic 5 implementation began on 2026-08-15. The repository now has a focused
`deploy-lab-status` command and portable shell test for empty, first-release,
two-release, and invalid release state. CI runs the test before a candidate
image can be published. No status command or sudo rule has yet been installed
on the VPS: its existing security boundary deliberately prevents it without a
privileged maintenance path. The next `main` revision containing this work is
the agreed harmless forward-release candidate; public rollout, return, reboot,
and source-host retirement have not begun.

On 2026-08-18 the owner approved an amendment from manually dispatched releases
to automatic production preparation after a complete successful `main`
pipeline. The `production` Environment approval remains mandatory; the manual
full-SHA dispatch remains as a protected recovery path. The owner explicitly
kept merge enforcement with the team lead instead of adding branch protection
or repository rulesets. Implementation is blocked first on verifying and
correcting the live `wget` healthcheck, establishing a compatible known-good
digest, and then independently verifying the exact image after the existing
quality workflow completes without modifying that workflow's gate.

On 2026-08-21 the owner created a dedicated `maintenance` SSH identity on the
target VPS through the provider console and approved passwordless `sudo` for
Epic 5. The maintenance identity is distinct from GitHub, bot, `deployer`, and
forced Actions identities; its private key remains only in the workstation SSH
Agent and is not a repository artifact.

The first read-only Epic 5 baseline found current and previous release digest
`sha256:8891c68e54ab1c6423a1e277394dc38996b260f523d3bb3e5c31dacef1f742f7`.
The public site returned trusted HTTPS 200, but the running Caddy container was
unhealthy. Its installed `wget` healthcheck left 1103 processes in the container
cgroup, including unreaped `ssl_client` zombies parented by Caddy; generic
`docker exec /bin/true` also failed with `procReady not received`. This confirms
the reported healthcheck failure mode.

On 2026-08-21, PR #10 was merged as `c74c8d49cad2ab305a33d48d8443440c0f270e09`.
Its complete `main` quality run published the immutable corrected image
`ghcr.io/conspiracy-dev/deploy-lab@sha256:653f0283674afa6e840ddecd712b6b13b7e61c8e89ba8f8a326022e6135a0bfb`.
Following Environment `production` approval, the protected release workflow
installed that image. Approved maintenance replaced the root-owned Compose file
after checksum and `docker compose config` validation; the old file remains as
a root-owned recovery copy. The installed corrected Compose checksum is
`055c8f53963f527f02e3582814e26d1d135a5d191095caac23282c067ee71bf2`.

On 2026-08-22, image A was verified healthy after more than seventeen hours,
with one cgroup process and no `ssl_client` zombies. Current image A and the
former `wget` image were recorded as current and previous release respectively.
A controlled container restart returned to healthy in six seconds; trusted
public HTTPS, `/`, `/privacy-policy`, `robots.txt`, `sitemap.xml`, a real 404,
security headers, immutable Nuxt asset caching, expected listeners, and the
default-drop firewall policy were rechecked. Image A is the first compatible
known-good rollback target; the old `wget` digest is audit history only.

On 2026-08-22, the owner explicitly prohibited changes to the CI/CD gate
configured by `iShavlovsky`. Epic 6 therefore adds an independent read-only
`workflow_run` verifier instead of changing `quality` or the protected release
workflow. It accepts only a successful `quality` run originating from a `main`
push, resolves the already-published SHA tag to an immutable digest, checks OCI
source/revision labels, smoke-tests that digest, and records a bounded artifact
only while the same revision remains current `main`. It has no Environment,
SSH, VPS access, repository/Environment secret, cache, or package-write
permission. Local policy, static-image, Compose, actionlint, and ShellCheck
evidence is complete. The full local Node `24.16.0` gate passed, including
typecheck, static quality (42 unit tests), dependency checks, build, generate,
Playwright (25 passed, 5 expected skips), Lighthouse, secret scan, task-intake,
and diff checks. PR #12 merged as
`c05cec286966919f1778ba106370dcc6c0986d29`; its successful `quality` run
automatically triggered successful `verify production candidate` run
`32565982468`. That run confirmed current `main`, resolved and smoke-tested
`ghcr.io/conspiracy-dev/deploy-lab@sha256:f138699caf90a0c76f54554a143f8e4fa693fe3bbc89ccfdfdbff7e346ed7fb8`,
validated OCI provenance, and retained its bounded evidence artifact. The
positive live evidence completes Epic 6; stale/cancelled cases remain covered
by its fail-closed fixtures. This did not grant an Environment, SSH, VPS,
custom-secret, cache, or package-write capability.

On 2026-08-22, the owner decided to retain `release.yml` as the manual recovery
entry point while replacing its direct SSH and digest logic with a shared
reusable production-release workflow. The same reusable workflow is called by
an independent automatic preparation workflow after a verified candidate run.
Its unprivileged preparation validates full-SHA ancestry, successful `quality`
provenance, bounded candidate evidence, immutable digest, OCI labels, and the
legacy-image denylist. Its sole `production` job receives Environment-scoped
SSH material only after the existing required reviewer approves. This preserves
one implementation for automatic and manual release selection without changing
the `quality` CI gate; a post-merge live run remains necessary before Epic 7 is
accepted.

On 2026-08-23, the first automatic preparation run `32595571596` stopped in
the shared policy before requesting Environment approval. The candidate artifact
had already been schema-validated against the selected revision, but the
workflow exported only its immutable digest and quality-run ID; the required
candidate revision was consequently empty at the policy boundary. The
correction exports that validated artifact revision and passes it to the
existing policy input. The policy still requires exact SHA equality with the
selected release, so this restores rather than relaxes provenance validation.
It does not change `ci.yml`, permissions, secrets, approval, SSH, or VPS
behaviour; a green post-merge automatic preparation run is still required for
Epic 7 acceptance.

On 2026-08-23, two approved attempts of automatic release `32626473239` proved
that the reusable deployment boundary was not receiving the `production`
Environment secrets: both `DEPLOY_SSH_PRIVATE_KEY` and
`DEPLOY_SSH_KNOWN_HOSTS` were empty at the first validation step. The owner had
already re-saved both values through GitHub CLI from their local sources, so
the failure was not caused by stale secret values. The empty-value validation
stopped before SSH configuration, connection, or VPS mutation. The owner
therefore approved a narrow architectural correction: the reusable
`production-release.yml` workflow owns only unprivileged candidate
preparation and returns explicit eligibility and immutable-image outputs;
`prepare-production-release.yml` and the retained manual `release.yml` each
own a direct protected `production` deployment job. Those two jobs use the
same existing strict SSH options and root-owned digest-only wrapper, and share
the fixed non-cancelling `production-release` concurrency group. The minimal
inline transport duplication is intentional: it avoids a post-approval
checkout or helper-action supply-chain boundary, while `secrets: inherit`,
repository-level secrets, and repository deploy keys are rejected because they
would broaden the existing Environment-scoped secret boundary. This does not
modify `ci.yml`, approval rules, SSH/VPS permissions, or the release policy.
Only a reviewed post-merge automatic run can validate the corrected secret
injection path.

That validation completed on 2026-08-24. The reviewed merge
`f0bd90efea1c520e9c35b2fd9c36978962b19890` triggered successful automatic
release run `32698404280`: unprivileged preparation accepted the verified
candidate, and the approved direct `production` job received masked
Environment SSH secrets, used strict host-key verification, and deployed
`ghcr.io/conspiracy-dev/deploy-lab@sha256:8a4542659e704b61c3c5e136f3833803f47835a945c34c90e32b48617935edd9`.
The root-owned wrapper reported that digest healthy after recreating the
production container. This is live evidence that the direct caller boundary
preserves approval-gated secret injection without changing `ci.yml`, quality,
or SSH/VPS privilege.

Epic 8's authorised read-only audit on 2026-08-24 found a conflicting live SSH
state: `sshd -T` reports `passwordauthentication yes`. Root login and
keyboard-interactive authentication remain disabled, and the forced Actions key
still rejects an arbitrary command. The `deployer` account is outside the Docker
group; its sudo policy permits only the digest-regex deployment wrapper and the
read-only status command; root owns the runtime files and state directory.
Password SSH is therefore not treated as hardened. The planned wrapper update,
production smoke activation, and Epic 8 closure remain blocked until a separate
owner-authorised correction is applied and both maintenance and forced-key
access paths are rechecked.

On 2026-08-25, the owner resolved that discrepancy by reaffirming password SSH
as disabled and selecting a dedicated personal account,
`nikitazinevich_macbook`, with its own passphrase-protected Ed25519 key. The
account was created without sudo authority; its public-key fingerprint is
`SHA256:miJbekBZe6vduMPhiOl9mu/y6RIHbNpbw26KRTQ4Dwo`. The existing
maintenance key, the forced Actions key, and this owner key were independently
verified through pinned host-key SSH before and after the change.

The cause was OpenSSH's first-value parsing across included files:
cloud-init's `50-cloud-init.conf` set `PasswordAuthentication yes`, so the
later `99-deploy-lab-hardening.conf` could not override it. A root-owned,
mode-`0600` `00-deploy-lab-hardening.conf` now precedes it. `sshd -t` succeeded,
the SSH service was reloaded, and `sshd -T` reports `permitrootlogin no`,
`passwordauthentication no`, and `kbdinteractiveauthentication no`. This did
not deploy or restart the application, reboot the VPS, change the forced
Actions command, or grant the owner account sudo.

The root-owned deployment wrapper was also installed after local syntax and
isolated negative-case tests. It verifies the public routes before declaring a
digest healthy; if a candidate fails and the recorded compatible prior digest
recovers, it returns a non-zero result so GitHub records a failed deployment.
The new independent runner smoke has no Environment, SSH, package-write, or
VPS mutation authority. Local public smoke against the canonical production
origin passed. Final live acceptance completed in
[run `32841779571`](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/32841779571):
the reviewed `main` revision `7146a28cbfd7b6aac34822b53b113b34a8bb065c`
passed release policy, the protected deployment of
`ghcr.io/conspiracy-dev/deploy-lab@sha256:9ffb672694827fe54def0de62984bba023f35df68306f2cbd8d13bd7dbe2802f`
reported that exact digest healthy, and the independent public-smoke job passed
against the canonical production origin. The early local TLS connection retry
during container startup did not bypass health verification; the wrapper only
reported success after its retry and public-route checks passed.

On 2026-09-01, the owner approved a narrow manual-recovery compatibility
fallback after run `32848022798` safely rejected image A: the image's 2026-08-21
SHA predates the candidate-verification workflow introduced on 2026-08-22, so
no candidate artifact can exist. Only `workflow_dispatch` may fall back to one
successful historical `quality` push run for the exact SHA on `main`; it still
must resolve the immutable GHCR digest and prove matching OCI revision and
source labels before the existing Environment approval. Automatic releases
continue to require candidate evidence, and this decision changes neither
`ci.yml`, quality thresholds, reviewers, secrets, permissions, nor VPS
authority. The historical fallback remains subject to the same digest-only
wrapper and independent public smoke.

On 2026-09-01, the first post-merge recovery retry
[`33492839794`](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/33492839794)
failed safely before Environment approval because its 100-run historical-quality
JSON response was supplied as a `python3` command-line argument, exceeding the
runner argument-size limit. Candidate selection and deployment did not run, so
the VPS retained image B. The correction stores both candidate-run and
historical-quality-run API responses in `$RUNNER_TEMP` and passes only the
temporary-file path to Python. It does not alter the API query, exact-SHA
matching, quality policy, `ci.yml`, approval boundary, secrets, SSH, or VPS
authority; it makes the already-approved historical fallback executable at the
existing API page size.

The subsequent retry, [run `33494490972`](https://github.com/Conspiracy-Dev/deploy-lab/actions/runs/33494490972),
proved the temporary-file correction and all historical provenance checks, then
stopped before approval because it checked out image A's pre-policy source tree
and could not find `production-release-policy.sh`. The reusable workflow now
checks out the immutable current workflow revision (`github.sha`) for its
release-policy code; selected historical SHA remains the independently
validated input to ancestry, quality, GHCR digest, and OCI-label checks. This
does not make historical source code executable in the release job, weaken its
provenance, or change `ci.yml`, approvals, secrets, SSH, or VPS authority.
