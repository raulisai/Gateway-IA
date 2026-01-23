# --- Stage 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app

# Declare build argument
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN echo "Building with API URL: $NEXT_PUBLIC_API_URL" && \
    npm run build

# --- Stage 2: Run ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Redeclare for runtime
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Use npm start for production
CMD ["npm", "start"]
