# syntax=docker/dockerfile:1.7
# Multi-stage image. Secrets are NEVER baked in: all configuration comes from the environment at runtime.

FROM node:22.12-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- dependencies (full, for building and for the tools image) ----
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM deps AS build
COPY . .
# The build does not need a database; dummy values satisfy config loading.
RUN DATABASE_URL=postgres://build:build@127.0.0.1:5432/build PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime \
    npm run build

# ---- tools: full source + deps for migrate / seed / create-admin (docker compose run --rm tools ...) ----
FROM deps AS tools
COPY . .
ENV NODE_ENV=production
CMD ["npm", "run", "migrate"]

# ---- runtime: minimal standalone server ----
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 MEDIA_DIR=/data/media RUN_MIGRATIONS_ON_START=true
RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app \
    && mkdir -p /data/media && chown -R app:app /data
COPY --from=build --chown=app:app /app/.next/standalone ./.next/standalone
COPY --from=build --chown=app:app /app/scripts/start.mjs ./scripts/start.mjs
COPY --from=build --chown=app:app /app/package.json ./package.json
USER app
EXPOSE 3000
VOLUME ["/data/media"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/start.mjs"]
