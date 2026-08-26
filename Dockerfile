# syntax=docker/dockerfile:1.6

# --------- Stage 1: Build ---------
FROM node:26-alpine AS builder

WORKDIR /app

# OpenSSL e requerido pelo Prisma em alpine
RUN apk add --no-cache openssl

# Instala deps (cache de layer). O lockfile e obrigatorio para builds reproduziveis.
COPY package*.json ./
RUN npm ci

# prisma/ entra DEPOIS do npm ci de proposito: nao ha postinstall que dependa
# dele, entao mexer numa migration nao precisa invalidar a layer de deps.
COPY prisma ./prisma
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# Compila o seed (prisma/seed.ts) para JS, para rodar em producao sem ts-node
RUN npx tsc prisma/seed.ts \
    --outDir prisma \
    --module commonjs \
    --target es2022 \
    --esModuleInterop \
    --skipLibCheck \
    --moduleResolution node

# --------- Stage 2: Runtime ---------
FROM node:26-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl tini

# Instala apenas deps de producao. O CLI `prisma` esta em `dependencies`
# (e nao em devDependencies) justamente para que `prisma migrate deploy`
# funcione no boot do container sem baixar nada do registry.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Mesma logica do builder: prisma/ depois das deps, para preservar o cache.
COPY prisma ./prisma
RUN ./node_modules/.bin/prisma generate

# Copia o build e o Prisma Client gerado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Copia o seed compilado (seed.js) por cima do prisma/seed.ts da imagem runner
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js

# Falha o build cedo se as migrations nao vieram junto: sem elas o
# `migrate deploy` roda vazio e a API sobe apontando para um banco sem tabelas.
RUN test -d ./prisma/migrations && ls -1 ./prisma/migrations | grep -q . \
    || (echo "ERRO: prisma/migrations esta vazio ou ausente." && exit 1)

# Pasta de uploads. Em producao monte um Railway Volume aqui,
# senao os arquivos somem a cada redeploy (filesystem efemero).
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main"]
