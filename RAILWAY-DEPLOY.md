# Deploy no Railway — CONDIGTAL API

Guia operacional do deploy desta API (NestJS 10 + Prisma 5 + PostgreSQL).

---

## 1. Serviços a provisionar no Railway

| Serviço | Obrigatório | Observação |
|---|---|---|
| **API** (este repositório) | Sim | Build via `Dockerfile` (definido em `railway.json`) |
| **PostgreSQL** | Sim | `New → Database → Add PostgreSQL` |
| **Volume** | Sim, se houver upload de arquivos | Montar em `/app/uploads` |
| **Redis** | Não | Ver seção 6 |

### Por que o Volume é obrigatório

`ServeStaticModule` e `StorageService` gravam em disco local (`./uploads`).
O filesystem do Railway é **efêmero**: sem um Volume, todo arquivo enviado
some no próximo deploy. Crie o Volume e monte no mount path `/app/uploads`.

---

## 2. Variáveis de ambiente

Todas em `Service → Variables`. `PORT` **não deve ser definida** — o Railway
injeta e a aplicação já lê `process.env.PORT`.

### Obrigatórias

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` (referência ao serviço Postgres) |
| `NODE_ENV` | `production` |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` (**diferente** do de acesso) |
| `CORS_ORIGINS` | Domínios reais separados por vírgula. Nunca `*` em produção |

### Recomendadas

| Variável | Sugestão |
|---|---|
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `UPLOAD_DIR` | `/app/uploads` (igual ao mount path do Volume) |
| `MAX_FILE_SIZE_MB` | `10` |
| `PASSWORD_RESET_TTL_HOURS` | `2` |
| `PASSWORD_RESET_BASE_URL` | `https://SEU-DOMINIO/auth/reset-password` |

### E-mail (opcional — sem elas, e-mails só são logados)

`MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`,
`MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`, `LEAD_NOTIFICATION_EMAILS`

> Gmail exige **App Password**, não a senha da conta.

---

## 3. Como o deploy funciona

1. `railway.json` manda usar o `Dockerfile` (multi-stage, roda como usuário `node`).
2. No boot do container: `prisma migrate deploy && node dist/main`.
3. O Railway faz health check em `/api/health` (timeout 300s).
4. Falhou? Restart automático, até 10 tentativas.

As migrations são aplicadas **automaticamente** no boot. Migration destrutiva
vai executar sem confirmação — revise antes do merge.

---

## 4. Secrets e variables do GitHub

`Settings → Secrets and variables → Actions`

**Secrets**

| Nome | Onde obter |
|---|---|
| `RAILWAY_TOKEN` | Railway → Project Settings → Tokens → *Create Token* |

**Variables** (não são segredo)

| Nome | Valor |
|---|---|
| `RAILWAY_SERVICE` | Nome exato do serviço no Railway (ex.: `api-gestao-condominio`) |
| `RAILWAY_PUBLIC_URL` | URL pública, sem barra final (ex.: `https://api.condigtal.up.railway.app`) |

Sem `RAILWAY_PUBLIC_URL` o health check pós-deploy é pulado (não falha).

---

## 5. Primeiro deploy — passo a passo

```bash
# 1. Confirme que as migrations estão versionadas
git add prisma/migrations && git status

# 2. Valide localmente o mesmo caminho que o Railway usa
docker build -t condigtal-api:test .

# 3. No Railway: crie o projeto, adicione o Postgres,
#    conecte este repositório e preencha as Variables da seção 2.

# 4. Crie o Volume em /app/uploads

# 5. Faça o merge na main — o CD dispara sozinho após o CI passar.
```

Seed inicial (opcional, uma vez):

```bash
railway run npm run prisma:seed
```

---

## 6. Notas de arquitetura

**Redis não é necessário hoje.** O `ThrottlerModule` usa storage em memória.
Com `numReplicas: 1` (configurado em `railway.json`) isso funciona. Se
escalar para 2+ réplicas, o rate limit passa a valer **por instância** — aí
sim adicione Redis e o `@nest-lab/throttler-storage-redis`.

**Swagger fica público** em `/api/docs`. Em produção, proteja com auth ou
desabilite via `NODE_ENV`.

**Uploads em Volume não escalam horizontalmente.** Um Volume do Railway
conecta a uma única instância. Para múltiplas réplicas, migre o
`StorageService` para S3/R2.
