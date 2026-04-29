# syntax=docker/dockerfile:1.6

# --------- Stage 1: Build ---------
FROM node:20-alpine AS builder

WORKDIR /app

# OpenSSL é requerido pelo Prisma em alpine
RUN apk add --no-cache openssl

# Instala deps (cache de layer). Usa `npm ci` se houver lockfile, senão `npm install`.
COPY package*.json ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copia o resto e faz o build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# Compila o seed (prisma/seed.ts) para JS, para rodar em produção sem ts-node
RUN npx tsc prisma/seed.ts \
    --outDir prisma \
    --module commonjs \
    --target es2022 \
    --esModuleInterop \
    --skipLibCheck \
    --moduleResolution node

# --------- Stage 2: Runtime ---------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl tini

# Instala apenas deps de produção
COPY package*.json ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
 && npx prisma generate \
 && npm cache clean --force

# Copia build e pastas necessárias
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Copia o seed compilado (seed.js) por cima do prisma/seed.ts da imagem runner
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js

# Cria pasta de uploads
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
