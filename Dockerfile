# Multi-Repo-Build: garten nutzt Sources aus real-life-stack + web-of-trust
# als Sibling-Verzeichnisse (siehe vite.config.ts Aliase).
# Build-Context muss auf das Parent-Verzeichnis zeigen, das alle drei Repos enthaelt.
# Siehe .github/workflows/deploy.yml fuer Multi-Checkout.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache git python3 make g++

# Web-of-Trust zuerst — pnpm-Workspace mit eigenen Deps.
COPY web-of-trust /app/web-of-trust
WORKDIR /app/web-of-trust
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Real-Life-Stack — pnpm-Workspace, referenziert WoT via overrides
COPY real-life-stack /app/real-life-stack
WORKDIR /app/real-life-stack
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# garten — eigentliche App (Cosmic Garden), nutzt beide via Vite-Aliase
WORKDIR /app/garten
COPY garten/package.json garten/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY garten/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/garten/dist /usr/share/nginx/html
COPY --from=build /app/garten/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
