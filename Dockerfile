# syntax=docker/dockerfile:1

# ---- frontend build ----
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
# VITE_ vars are baked at build time; .env is not shipped in the image (context-ignored)
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_API_URL
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY:-}
ENV VITE_API_URL=${VITE_API_URL:-/api}
COPY . .
RUN bun run build

# ---- contact API (bun runtime) ----
FROM oven/bun:1-slim AS api
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY server ./server
ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "run", "server/index.ts"]

# ---- static site + API reverse proxy ----
FROM nginx:alpine AS web
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
