# Security policy

## Supported code

Security fixes are assessed for the current default branch. Generated output,
local `.env` files, and development-only fixture data are not a security
boundary.

## Reporting a vulnerability

Do not create a public issue, paste proof-of-concept secrets, or attach live
credentials. Use the repository's private security-reporting feature when it is
enabled; otherwise contact the repository owner, Igor Shavlovsky, through an
already agreed private channel.

Include the affected revision, impact, reproducible steps, and a safe minimal
proof. The owner will acknowledge the report, assess severity, and coordinate a
fix and disclosure timeline privately.

## Secret handling

Secrets, tokens, private URLs, cookies, and personal data never belong in Git,
AI contour files, screenshots, logs, or issues. Supply runtime secrets through
environment variables or an approved secret store.
