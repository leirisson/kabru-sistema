# Stage 1: Install dependencies
FROM node:22-alpine AS deps

WORKDIR /app

COPY system/package.json system/package-lock.json* ./

# Sem --ignore-scripts para não pular postinstall do Prisma e outros pacotes nativos
RUN npm ci

# Stage 2: Build application
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY system/package.json system/package-lock.json* ./
COPY system/ .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia todo node_modules (necessário para pg, @prisma/adapter-pg, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# prisma.config.ts contém a DATABASE_URL no Prisma 7 (não fica no schema.prisma)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# entrypoint.sh executa as migrations antes de iniciar o servidor
CMD ["./entrypoint.sh"]
