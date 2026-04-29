# CONDIGTAL · API de Gestão de Condomínio

[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Private-lightgrey)](#)

API REST que sustenta o ecossistema **CONDIGTAL** — sistema de gestão de condomínios composto por este backend + um app mobile em React Native (repo separado: [`gestao-condominio-app`](https://github.com/GabrielAAS28/gestao-condominio-app)).

Originalmente escrita em **Spring Boot**, foi reescrita em **NestJS + TypeScript** mantendo o esquema de tabelas (`gc_*`) para preservar compatibilidade com scripts SQL legados.

---

## Sumário

- [Stack](#stack)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Quick start (Docker)](#quick-start-docker)
- [Quick start (local)](#quick-start-local)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Autenticação e autorização](#autenticação-e-autorização)
- [Documentação Swagger](#documentação-swagger)
- [Scripts npm](#scripts-npm)
- [Migrations e seed](#migrations-e-seed)
- [Deploy em VPS](#deploy-em-vps)
- [Roadmap](#roadmap)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | **NestJS 10** (TypeScript) |
| ORM | **Prisma 5** |
| Banco | **PostgreSQL 16** |
| Auth | **JWT** access + refresh + bcrypt |
| Validação | `class-validator` / `class-transformer` |
| Docs | Swagger (`/api/docs`) |
| Email | Nodemailer (SMTP, com modo dry-run) |
| Upload | Multer + storage local em disco |
| Segurança | Helmet, CORS allowlist, Throttler, refresh token rotation |
| Container | Docker multi-stage + docker-compose |

## Funcionalidades

- 🔐 **Auth**: login, logout, refresh, forgot/reset password
- 👤 **Pessoas / Usuários**: CRUD, troca de senha, foto de perfil
- 🏢 **Condomínios** + **Unidades** + **Ocupantes** (vínculo proprietário/locatário)
- 🛡️ **Roles dinâmicos por condomínio** (`SINDICO_<id>`, `PORTEIRO_<id>`, `MORADOR_<id>`, etc.)
- 📅 **Áreas comuns** + **turnos** + **reservas** (aprovar/rejeitar/cancelar/concluir)
- ⚠️ **Ocorrências** com comentários e anexos
- 📣 **Comunicados** multi-condomínio com confirmação de leitura
- 📦 **Encomendas** (registro/retirada)
- 👋 **Visitantes** (entrada/saída autorizada pelo morador)
- 📜 **Contratos** com fornecedores
- 🌐 **Leads** públicos (formulário da landing page)

## Arquitetura

```
┌────────────────────┐      HTTPS / JWT       ┌─────────────────────┐
│  React Native App  │ ─────────────────────▶ │   NestJS REST API   │
│  (Android / iOS)   │                        │   (este repo)       │
└────────────────────┘                        └──────────┬──────────┘
                                                         │ Prisma
                                                         ▼
                                              ┌─────────────────────┐
                                              │   PostgreSQL 16     │
                                              └─────────────────────┘
```

- **`/api/*`** prefixo global (configurável via env).
- Filtro global de exceções traduz erros do Prisma (`P2002`, `P2025`, etc.) para HTTP semântico.
- Guard global JWT — endpoints públicos marcados com `@Public()`.
- Guard de roles parametrizado por condomínio: `@Roles({ papel: 'SINDICO', condominioParam: 'id' })`.

## Quick start (Docker)

> Recomendado para WSL/Linux/macOS — sobe API + Postgres com um comando.

```bash
git clone https://github.com/GabrielAAS28/api-gestao-condominio
cd api-gestao-condominio

# 1. copia o template de env
cp .env.example .env
# edite .env conforme sua máquina (em especial JWT_*_SECRET)

# 2. sobe os serviços
docker compose up -d

# 3. aplica migrations + seed inicial
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed

# 4. logs
docker compose logs -f api
```

API disponível em `http://localhost:3000/api`, Swagger em `http://localhost:3000/api/docs`.

### Comandos úteis

```bash
docker compose down              # parar
docker compose down -v           # parar e apagar volumes (zera o banco)
docker compose exec api sh       # shell dentro do container
docker compose exec postgres psql -U admin -d condigtal_dev
```

## Quick start (local)

Sem Docker, com Postgres rodando direto na máquina:

```bash
# 1. instalar deps
npm install

# 2. copiar e editar .env
cp .env.example .env

# 3. gerar Prisma Client + aplicar schema
npm run prisma:generate
npm run prisma:migrate

# 4. seed
npm run prisma:seed

# 5. dev server (watch)
npm run start:dev
```

## Estrutura do projeto

```
src/
├── main.ts                    # bootstrap (helmet, swagger, validation pipe, CORS)
├── app.module.ts              # módulos globais e features
├── config/                    # loader das envs
├── common/
│   ├── prisma/                # PrismaService global
│   ├── decorators/            # @Public, @CurrentUser, @Roles, @GlobalAdminOnly
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   └── filters/               # HttpExceptionFilter (mapeia erros Prisma)
├── shared/
│   ├── email/                 # EmailService (nodemailer)
│   └── storage/               # StorageService (uploads em disco)
└── modules/
    ├── auth/                  # login, refresh, logout, forgot/reset password
    ├── pessoas/
    ├── condominios/
    ├── unidades/
    ├── usuario-condominio/    # papéis dinâmicos por condomínio
    ├── ocupantes/
    ├── ocorrencias/           # CRUD + comentários + anexos
    ├── comunicados/           # multi-condomínio + anexos + confirmação de leitura
    ├── encomendas/            # PK BigInt
    ├── visitantes/
    ├── areas-comuns/          # com turnos
    ├── reservas/              # aprovar/rejeitar/cancelar/concluir
    ├── contratos/
    └── leads/                 # endpoint público para landing page

prisma/
├── schema.prisma              # data model (mantém naming gc_*)
├── seed.ts                    # seed inicial (admin global, etc.)
└── run-seed.js                # bootstrap para rodar seed em prod

uploads/                       # storage local (volume persistido em prod)
```

## Variáveis de ambiente

Use `.env.example` como base. Resumo:

| Variável | Default | Descrição |
|----------|---------|-----------|
| `NODE_ENV` | `development` | — |
| `PORT` | `3000` | Porta do HTTP server |
| `DATABASE_URL` | — | URL Postgres |
| `JWT_ACCESS_SECRET` | — | **obrigatório** — `openssl rand -hex 32` |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | TTL do access token |
| `JWT_REFRESH_SECRET` | — | **obrigatório** — separado do access |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | TTL do refresh token |
| `CORS_ORIGINS` | `*` | CSV de origens permitidas |
| `MAIL_HOST/PORT/SECURE/USER/PASSWORD` | — | SMTP — sem credenciais entra em modo dry-run |
| `UPLOAD_DIR` | `./uploads` | Storage local |
| `MAX_FILE_SIZE_MB` | `10` | Limite de upload |
| `PASSWORD_RESET_TTL_HOURS` | `2` | Validade do token de reset |
| `PASSWORD_RESET_BASE_URL` | — | URL do frontend que recebe o token |
| `LEAD_NOTIFICATION_EMAILS` | — | Destinatários do POST `/api/leads` (CSV) |

> ⚠️ **Nunca** comite o `.env` real — apenas `.env.example`. O `.gitignore` já está configurado para isso.

## Autenticação e autorização

### Login

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@condigtal.com", "senha": "123456" }
```

Resposta:

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "usuario": { "pesCod": 1, "pesNome": "...", "roles": ["ROLE_SINDICO_1"], "isGlobalAdmin": false }
}
```

### Refresh

```http
POST /api/auth/refresh
{ "refreshToken": "..." }
```

O servidor faz **rotação** do refresh token (revoga o atual e emite outro).

### Roles dinâmicos

A claim `roles` carrega papéis no formato `ROLE_<PAPEL>_<conCod>`. Ex.: `ROLE_SINDICO_3` = síndico do condomínio 3. Use:

```ts
@Roles({ papel: 'SINDICO', condominioParam: 'id' })
@Get(':id/...')
metodo(@Param('id') conCod: number) { /* ... */ }
```

`@GlobalAdminOnly()` permite acesso irrestrito a quem tem `pesIsGlobalAdmin = true`.

## Documentação Swagger

Após subir a API, acesse:

```
http://localhost:3000/api/docs
```

Cole o `accessToken` no botão **Authorize** para testar endpoints autenticados.

## Scripts npm

| Comando | O que faz |
|---------|-----------|
| `npm run start:dev` | Watch mode |
| `npm run start:prod` | Roda `dist/main.js` |
| `npm run build` | Compila TypeScript |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:migrate` | Cria nova migration (dev) |
| `npm run prisma:migrate:deploy` | Aplica migrations (prod) |
| `npm run prisma:studio` | UI gráfica do Prisma |
| `npm run prisma:seed` | Roda `prisma/seed.ts` |
| `npm run db:reset` | **destrutivo** — recria schema do zero |
| `npm run lint` | ESLint + autofix |
| `npm run format` | Prettier |

## Migrations e seed

```bash
# Criar nova migration durante desenvolvimento
npm run prisma:migrate -- --name add_alguma_coisa

# Aplicar em produção (não cria nova, só executa as existentes)
npm run prisma:migrate:deploy

# Seed inicial (admin global e dados-base)
npm run prisma:seed
```

Para popular o banco com dados de simulação realistas (condomínios, pessoas, unidades, áreas comuns, reservas, etc.), use o script `sql/seed-completo.sql` do app mobile:

```bash
psql -h localhost -U admin -d condigtal_dev \
  -f ../gestao-condominio-app/sql/seed-completo.sql
```

## Deploy em VPS

Veja o passo-a-passo completo em **[`DEPLOY-VPS.md`](DEPLOY-VPS.md)**:

1. Provisionar VPS (Hetzner, DigitalOcean, etc.)
2. Setup do servidor (usuário não-root, firewall, Docker)
3. Clone do repo, configurar `.env` de produção
4. `docker compose up -d --build`
5. Migrations + seed
6. Reverse proxy (Nginx/Caddy) + HTTPS

## Roadmap

- [ ] Módulo financeiro (cobranças automáticas, integração Pix/Boleto)
- [ ] Push notifications (FCM/APNs) integradas com eventos de reserva
- [ ] Audit log
- [ ] Storage S3-compatible
- [ ] Testes E2E (Jest + Supertest)

---

Este software é um produto comercial.

Copyright (c) 2025 Horizon AJ Soluções Digitais Ltda. Todos os direitos reservados.
