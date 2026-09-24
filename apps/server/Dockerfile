# Server game. Build từ gốc repo: docker build -f apps/server/Dockerfile -t rok-server .
FROM node:24-slim AS deps
WORKDIR /app
# npm ci kiểm lockfile với mọi workspace: chép đủ package.json
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/
COPY packages/rules/package.json packages/rules/
COPY packages/protocol/package.json packages/protocol/
COPY packages/i18n/package.json packages/i18n/
COPY packages/art/package.json packages/art/
RUN npm ci --omit=dev --workspace @rok/server --ignore-scripts

FROM node:24-slim
ENV NODE_ENV=production PORT=8787
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY package.json ./
COPY packages/rules packages/rules
COPY packages/protocol packages/protocol
COPY packages/i18n packages/i18n
COPY apps/server/package.json apps/server/
COPY apps/server/src apps/server/src
COPY apps/server/drizzle apps/server/drizzle
USER node
EXPOSE 8787
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD node -e "fetch('http://127.0.0.1:8787/readyz').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "--max-old-space-size=768", "apps/server/src/main.ts"]
