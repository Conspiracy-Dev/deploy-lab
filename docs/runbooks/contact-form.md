# Contact-form release and operation

Status: source implementation locally verified; production migration and live
Notion acceptance pending. The owner confirmed on 2026-10-04 that the Notion
token has not yet been provisioned.

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
   and `DOMAIN=noash.net`. Start both services with `up --detach --wait
--wait-timeout 120`. This initial operation precedes the ordinary wrapper
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

Agree exact test Name, Email and Message, and whether to retain the row. The
owner requested a test email but has not yet supplied its address. Submit once
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
