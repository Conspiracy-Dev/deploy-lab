# syntax=docker/dockerfile:1

FROM node:24.16.0-bookworm@sha256:40ad9f3064e67d6860b4bc3fe1880b2953934fd6320ada990e45fe0efa6badd7 AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate && pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild sharp

COPY app ./app
COPY content ./content
COPY public ./public
COPY shared ./shared
COPY content.config.ts nuxt.config.ts uno.config.ts ./

ARG NUXT_PUBLIC_SITE_URL

RUN test -n "$NUXT_PUBLIC_SITE_URL"

ENV NUXT_PUBLIC_SITE_URL=$NUXT_PUBLIC_SITE_URL

RUN pnpm exec nuxt prepare && pnpm generate

FROM caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/.output/public /srv
