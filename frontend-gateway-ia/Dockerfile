# --- Stage 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (only what's needed for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# We need this env variable during build time for Next.js to bake it in
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# --- Stage 2: Run ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build and static files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Next.js standalone server entry point
CMD ["node", "server.js"]
