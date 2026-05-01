# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev) for TypeScript compilation
COPY package*.json ./
RUN npm install

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# tsc does not copy non-TS assets — migrate.js reads schema.sql via __dirname
RUN cp src/infrastructure/database/schema.sql dist/infrastructure/database/schema.sql

# ---- Runtime stage ----
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Ensure uploads directory exists (multer writes here)
RUN mkdir -p uploads

EXPOSE 5000

# Run migrations (idempotent) then start the server.
# Seeding is destructive (TRUNCATE) — run manually via:
#   docker compose exec backend node dist/infrastructure/database/seed.js
CMD node dist/infrastructure/database/migrate.js && node dist/server.js
