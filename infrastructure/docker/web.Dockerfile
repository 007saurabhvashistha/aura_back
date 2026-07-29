# ---- Aura Web (apps/web) ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY services/api/package.json services/api/
COPY apps/web/package.json apps/web/
RUN npm install

COPY . .
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build:shared \
  && npm run build --workspace @aura/web

# ---- Runtime (static files via nginx) ----
FROM nginx:1.27-alpine AS runtime
COPY infrastructure/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
