# Contact-form release and operation

Status: source implementation locally verified; production migration and live
Notion acceptance pending. On 2026-10-04 the owner provisioned private
configuration; a subsequent read-only VPS check verified root ownership,
mode 0600 and both configuration entries without revealing values. Token
authorization and live delivery are not yet proven.

## Runtime

Caddy serves the generated pages and proxies only `/api/contact` to `api:3000`.
Both Compose services use the same immutable image digest. The `api` service
runs one Nitro process as `node`, has no published port and receives Notion
configuration only at runtime. Caddy overwrites the client-supplied
`X-Forwarded-For`; enabling another proxy/CDN requires revisiting this policy.
Its runtime error logger removes the request object; access logging remains
disabled so client IPs and headers are not recorded on a failed proxy call.

The image is built with `pnpm build` and explicit page prerendering. The
existing `test:docker:smoke` and `test:docker:image` commands retain their names
for CI compatibility but now verify the page and API profile. The local image
tag `deploy-lab-static:local` is retained for the same reason.

With dependencies and the existing Playwright browser installed, run
`CONTACT_SMOKE_BROWSER=1 pnpm test:docker:smoke` to also check the built image's
form at 390 and 1440 px. The normal image smoke requires no Node packages on
the caller, preserving the read-only candidate-verification workflow.

## Private configuration

Create a Notion integration with Insert Content access and share only
`DeployLab — Contact requests` under `Лендинг DeployLab` with it. Use the data
source ID, not the database ID. Keep both values out of Git and chat.

Through the approved owner-maintenance path, provision root-owned mode-0600
`/opt/deploy-lab/contact.env` with these names and actual values:

```dotenv
NUXT_NOTION_TOKEN=
NUXT_NOTION_DATA_SOURCE_ID=
```

Compose reads this file for `api` only. Its production configuration fixes
`NUXT_PUBLIC_SITE_URL=https://noash.net` and `NUXT_TRUST_PROXY=true`. The build
also needs the canonical public URL. Do not print `docker compose config` with
live secrets; use `config --quiet`. Local tests use synthetic values and do not
send a request to Notion.

### Owner configuration helpers

From the repository root on the workstation, use the already approved local
SSH alias for the maintenance account. The alias and key remain in the local
SSH configuration, not in this repository. The commands prompt for the alias;
an optional second argument supplies it explicitly.

```bash
bash scripts/deployment/contact-vps.sh connect
bash scripts/deployment/contact-vps.sh setup
bash scripts/deployment/contact-vps.sh check
```

Run each command on the workstation, not inside the VPS shell. After `connect`,
use `exit` to return to the workstation before running `setup` or `check`.

`connect` opens a terminal. `setup` runs a scoped root helper through the
existing passwordless maintenance sudo path and opens the VPS `nano` editor.
Enter only `NUXT_NOTION_TOKEN` and `NUXT_NOTION_DATA_SOURCE_ID` there; save with
Ctrl+O, Enter and exit with Ctrl+X. A missing editor or unexpected permissions
stops the operation without installing packages or widening privileges.
Existing content is never automatically replaced. Do not screenshot the editor.

`check` validates root ownership, mode 0600, absence of symlink/hard-link
redirection and both configuration entries without displaying values or
executing the file. It does not authenticate to Notion. All commands require
the existing maintenance identity on the documented production host, strict
host-key verification and SSH-Agent authentication; forwarding is disabled.
They do not install scripts on the VPS, deploy images, restart containers or
change SSH/sudo privileges. Run setup only for owner-approved provisioning;
possession of the alias alone does not authorize production operations.

Verify these helpers locally with `bash scripts/deployment/contact-vps.test.sh`
and `bash scripts/deployment/contact-env.test.sh`. The latter requires the
existing `deploy-lab-static:local` image and Docker; it uses a disposable,
network-disabled container with synthetic configuration and no production
volumes.

`/contact-health` is accessible only within the API service. A 200 proves that
the process can respond and private values are nonempty; it does not prove
that the token is authorized. Missing values return 503 without disclosing
which value is absent. Caddy returns a static 404 for this path.

## First migration

1. Obtain code review and a verified `main` image from the existing protected
   publication workflow. Do not release a branch or change its approval gate.
2. Through owner maintenance, back up the current root-owned Compose,
   Caddyfile, deployment wrapper, and current/previous image-state files as
   one recoverable bundle; preserve persistent Caddy volumes.
3. Provision the private configuration. Install the reviewed production
   Compose, Caddyfile and wrapper, preserving root ownership and the existing
   forced-command/sudo boundary. Do not grant the deployer Docker access.
4. Pull the verified digest. Check its `dev.deploy-lab.runtime=contact-v1`
   label, validate Caddy, and run Compose `config --quiet` with that digest
   and `DOMAIN=noash.net`. Start both services with
   `up --detach --wait --wait-timeout 120`. This initial operation precedes the ordinary wrapper
   because the wrapper deliberately rejects a static current release.
5. Verify pages, TLS, SEO files, assets, 404 and `GET /api/contact` → 405. Check
   internal API readiness and run the agreed single live request below. If
   acceptance fails, restore the backed-up static configuration/state bundle
   and its original digest together; remove only the newly introduced API
   container. Do not delete Caddy volumes or the private configuration file.
6. After acceptance, record the hybrid digest in the current-image state.
   Treat it as the first compatible rollback baseline. The old static digest
   remains historical recovery evidence, not a normal digest-only target.

## Routine release and rollback

The existing digest-only wrapper waits for both services to become healthy and
checks the public API's method restriction without creating a Notion row.
It saves the compatible current digest only after the candidate passes
preflight. On failure it restores that digest for both services. Static images
are rejected before live release state changes. The configured credentials
remain outside image-state files and are not rolled back with an image.

The initial migration requires the full backup bundle for rollback. Subsequent
hybrid releases use the normal protected workflow and compatible digest-only
rollback. Verify both the successful path and failed-candidate restoration.

## Live acceptance and diagnostics

The owner approved Name `DeployLab Epic 4 smoke`, Message
`Тест контактной формы, Epic 4` and retaining the row. The exact test email
address was supplied privately and must not be copied into repository
documentation. All test values are agreed; production release approval is
still required. Submit once
through the real form. Confirm 201, the success notice at 390 and 1440 px, and
exactly one Notion row with the agreed values, Status `New` and Submitted at.
Do not create a substitute row with the Notion MCP: acceptance must prove the
site's own credential and complete request path. Do not automatically repeat
a timed-out request; Notion may already have accepted it.

On failure, the form keeps its values and announces a retryable error. Logs
contain request ID, duration and error class only. Check token validity and
database sharing for authorization failures without printing credentials or
submitted data. Record the accepted production revision and safe test evidence
in the roadmap before closing Epic 4.
