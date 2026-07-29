# ---- Aura API (services/api) ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps using the workspace manifests (better layer caching).
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY services/api/package.json services/api/
COPY apps/web/package.json apps/web/
RUN npm install

# Copy sources and build shared + api.
COPY . .
RUN npm run build:shared \
  && npm run build --workspace @aura/api

# ---- Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/services/api/dist ./services/api/dist
COPY --from=build /app/services/api/package.json ./services/api/package.json

EXPOSE 4000
CMD ["node", "services/api/dist/index.js"]
