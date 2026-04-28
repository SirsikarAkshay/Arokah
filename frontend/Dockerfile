# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build the Vite bundle
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Build-time variables (must be declared here so Vite can inline them).
# Pass with: docker build --build-arg VITE_API_BASE_URL=... --build-arg VITE_WS_BASE_URL=...
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_APP_VERSION
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_WS_BASE_URL=${VITE_WS_BASE_URL} \
    VITE_APP_VERSION=${VITE_APP_VERSION}

COPY . .
RUN npm run build:production


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Serve with nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default site, install our SPA config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/ritha-web.conf

COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
