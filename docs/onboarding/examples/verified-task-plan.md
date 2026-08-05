# Example: semantic hero fallback

## Goal

Keep the hero's essential proposition indexable when its optional 3D scene is
unavailable.

## Non-goals

Do not redesign the visual system, add a scene dependency, or change routes.

## Constraints

Preserve SSR/prerendered text and current public metadata contract.

## Ownership seam

The page composes semantic fallback content; the isolated scene owns only
progressive visual enhancement.

## Plan

1. Inspect the current hero page and scene component.
2. Add or adjust semantic fallback markup at the page/component boundary.
3. Keep the scene optional and defer non-essential client work.

## Verification

Run the focused unit or E2E test, then capture a browser screenshot with the
scene unavailable and inspect the rendered semantic copy.

## Risk and stop condition

Stop if the change requires a route, metadata, or design-system contract change
that was not approved.
