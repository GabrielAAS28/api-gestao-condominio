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

**Quem faz o deploy é o Railway, não o GitHub Actions.**

`Service → Settings → Source`:

| Opção | Estado exigido |
|---|---|
| Auto deploys when pushed to GitHub | ligado, branch `main` |
| **Wait for CI** | **ligado** |

Com *Wait for CI* ligado, o Railway só promove o deploy depois que as GitHub
Actions passarem. É isso que impede um merge com CI vermelho de chegar em
produção — por isso **não existe `RAILWAY_TOKEN` neste repositório**.

Sequência:

1. Merge na `main` → o CI roda.
2. CI verde → o Railway inicia o build.
3. `railway.json` manda usar o `Dockerfile` (multi-stage, roda como `node`).
4. No boot do container: `prisma migrate deploy && node dist/main`.
5. O Railway faz health check em `/api/health` (timeout 300s) antes de
   promover o deploy. Falhou? Restart automático, até 10 tentativas.
6. O workflow `cd-railway.yml` roda um smoke test no domínio público.

As migrations são aplicadas **automaticamente** no boot. Migration destrutiva
vai executar sem confirmação — revise antes do merge.

> Se a migration falhar, o `&&` impede o `node dist/main` de rodar: o
> container morre e o Railway não promove o deploy. Não mexa nesse `&&`.

---

## 4. Variables do GitHub

`Settings → Secrets and variables → Actions → aba Variables`

| Nome | Valor |
|---|---|
| `RAILWAY_PUBLIC_URL` | URL pública, sem barra final (ex.: `https://api-gestao-condominio-production.up.railway.app`) |

Sem ela o smoke test é pulado (não falha o workflow).

**Nenhum secret é necessário.** Se `RAILWAY_TOKEN` ou `RAILWAY_SERVICE`
ainda existirem de uma configuração anterior, podem ser removidos — um
token de deploy de longa duração guardado no CI é superfície de ataque
sem contrapartida, já que o deploy não passa mais por aqui.

### O que o smoke test valida — e o que não valida

Ele confirma que o **domínio público** está servindo a API, coisa que o
health check interno do Railway não cobre (aquele testa o container, não a
borda e o roteamento).

Ele **não** identifica qual versão respondeu. O `/api/health` devolve uma
versão estática, não o commit. Se o deploy ainda estiver em andamento, o
domínio pode estar servindo a versão anterior e o check passa mesmo assim.

Ou seja: **falha é sinal confiável de problema; sucesso é sinal fraco.**

Para fechar essa lacuna seria preciso o health devolver o SHA do commit
(build arg no `Dockerfile` + campo no `AppController`) e o workflow comparar
com o SHA que o disparou.

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

# 5. Ligue "Wait for CI" em Settings > Source

# 6. Faça o merge na main — o Railway aguarda o CI e deploya sozinho.
```

> **Cuidado com o health check enganoso.** O `/api/health` executa
> `SELECT 1`, que funciona mesmo num banco sem nenhuma tabela. Se o serviço
> subir antes das migrations existirem no repositório, ele responde
> `status: ok` com o schema vazio. Confirme com uma chamada que realmente
> leia dados antes de considerar o ambiente pronto.

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
