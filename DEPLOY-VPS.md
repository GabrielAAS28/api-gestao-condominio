# Deploy CONDIGTAL API em VPS — Guia passo a passo

Este guia leva a API NestJS + Postgres do `docker compose` local para uma VPS Linux com domínio + HTTPS.

## 1. Recomendação de provedores

| Provedor       | Plano sugerido       | RAM   | Preço aprox.   | Notas |
|----------------|----------------------|-------|----------------|-------|
| **Hetzner**    | CX22 (Ubuntu 24.04)  | 4 GB  | ~€4,5 / mês    | Melhor custo-benefício, datacenters EU/US |
| **DigitalOcean** | Basic Droplet 4GB  | 4 GB  | $24 / mês      | Setup fácil, painel intuitivo |
| **Contabo**    | VPS S                | 8 GB  | ~€5 / mês      | RAM/CPU mais generosos por preço, mas IO mais lento |
| **Vultr**      | Cloud Compute 4GB    | 4 GB  | $24 / mês      | Performance similar ao DO |

**Sugestão:** comece com **Hetzner CX22** (~€4,5/mês). Migra fácil depois se precisar de mais.

> Para 50–200 usuários simultâneos com Postgres no mesmo box, 2GB RAM já basta. Vai por 4GB para ter folga.

## 2. Preparação inicial do servidor

Após criar a VPS (escolha **Ubuntu 24.04 LTS**), conecte via SSH:

```bash
ssh root@SEU_IP
```

### 2.1. Atualizar sistema e criar usuário não-root

```bash
apt update && apt upgrade -y
adduser deploy                  # cria usuário "deploy" (senha forte!)
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Reforçar SSH (opcional, mas recomendado)
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

A partir daqui, conecte como `deploy@SEU_IP`.

### 2.2. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2.3. Instalar Docker + Compose plugin

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
# saia e reconecte para o grupo docker tomar efeito
exit
ssh deploy@SEU_IP
docker compose version   # confere
```

## 3. Subir a aplicação

### 3.1. Clonar o repositório

Suba o código (via Git ou rsync). Exemplo com Git:

```bash
cd ~
git clone https://github.com/SEU_USUARIO/api-gestao-condominio.git
cd api-gestao-condominio
```

### 3.2. Criar `.env` de produção

```bash
cp .env.example .env
nano .env
```

Variáveis obrigatórias para produção:

```env
NODE_ENV=production
PORT=3000

# Postgres (mantém o que está no compose, mas mude a senha!)
DATABASE_URL=postgresql://condigtal:UMA_SENHA_FORTE@postgres:5432/condigtal?schema=public
POSTGRES_USER=condigtal
POSTGRES_PASSWORD=UMA_SENHA_FORTE
POSTGRES_DB=condigtal

# JWT — GERE STRINGS LONGAS E ALEATÓRIAS!
# (use: openssl rand -hex 32)
JWT_ACCESS_SECRET=cole_aqui_uma_string_de_64_chars_aleatoria
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=cole_aqui_outra_string_de_64_chars_aleatoria
JWT_REFRESH_EXPIRES_IN=7d

# Email (opcional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=seuemail@gmail.com
MAIL_PASSWORD=senha_de_app_do_gmail
MAIL_FROM_NAME=CONDIGTAL
MAIL_FROM_ADDRESS=seuemail@gmail.com

# Redefinição de senha (URL do front para o link no email)
PASSWORD_RESET_TTL_HOURS=2
PASSWORD_RESET_BASE_URL=https://app.seudominio.com/auth/reset-password

# CORS — domínios permitidos (separados por vírgula)
CORS_ORIGINS=https://app.seudominio.com,https://api.seudominio.com

# Leads
LEAD_NOTIFICATION_EMAILS=admin@seudominio.com
```

### 3.3. Subir os containers

```bash
docker compose up -d --build
docker compose logs -f api
```

Quando ver `Nest application successfully started`, popule o banco:

```bash
docker compose exec api npx prisma db push
docker compose exec api npx prisma db seed
```

A API agora está acessível em `http://SEU_IP:3000/api`.

## 4. Domínio + HTTPS com Nginx + Let's Encrypt

### 4.1. Apontar o domínio

No painel do seu registrador (GoDaddy, Registro.br, Cloudflare, etc.), crie um **registro A**:

```
api.seudominio.com  →  SEU_IP_DA_VPS
```

Aguarde a propagação (geralmente < 30min). Confirme com:

```bash
dig api.seudominio.com +short    # deve retornar o IP da VPS
```

### 4.2. Instalar Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 4.3. Configurar reverse proxy

```bash
sudo nano /etc/nginx/sites-available/condigtal-api
```

Cole:

```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

Ative e teste:

```bash
sudo ln -s /etc/nginx/sites-available/condigtal-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 4.4. Gerar certificado SSL

```bash
sudo certbot --nginx -d api.seudominio.com
```

Siga os prompts (informe seu email, aceite os termos, escolha "redirect HTTP → HTTPS"). Pronto:

- `https://api.seudominio.com/api`         → API
- `https://api.seudominio.com/api/docs`    → Swagger
- `https://api.seudominio.com/api/health`  → Health check

Renovação é automática via cron do certbot.

## 5. Atualização da imagem do app mobile

No projeto React Native, edite `src/services/api.js`:

```js
const BASE_URL = 'https://api.seudominio.com/api';
```

Faça o build de produção (`npx react-native build-android` ou via Android Studio) e instale no device.

## 6. Backups do banco

### 6.1. Backup manual

```bash
docker compose exec postgres pg_dump -U condigtal condigtal | gzip > backup-$(date +%F).sql.gz
```

### 6.2. Backup automático (cron diário, mantém últimos 7 dias)

```bash
mkdir -p ~/backups
crontab -e
```

Adicione:

```cron
0 3 * * * cd /home/deploy/api-gestao-condominio && docker compose exec -T postgres pg_dump -U condigtal condigtal | gzip > /home/deploy/backups/backup-$(date +\%F).sql.gz && find /home/deploy/backups -name "*.sql.gz" -mtime +7 -delete
```

### 6.3. Restaurar

```bash
gunzip < backup-2026-04-25.sql.gz | docker compose exec -T postgres psql -U condigtal condigtal
```

## 7. Atualizando a aplicação

Quando puxar mudanças do código:

```bash
cd ~/api-gestao-condominio
git pull
docker compose up -d --build
docker compose exec api npx prisma migrate deploy   # se houver novas migrations
docker compose logs -f api
```

## 8. Monitoramento básico

```bash
docker stats                    # uso de CPU/RAM dos containers
docker compose logs -f api      # logs ao vivo
df -h                           # espaço em disco
free -h                         # RAM
```

Para alertas mais sérios, considere adicionar **Uptime Kuma** ou **Better Uptime** apontando para `/api/health`.

## 9. Checklist de produção

- [ ] Senha forte do `POSTGRES_PASSWORD` (não a default do exemplo)
- [ ] `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` gerados com `openssl rand -hex 32`
- [ ] `CORS_ORIGINS` listando apenas os domínios reais (não `*`)
- [ ] HTTPS configurado e redirect 80→443 ativo
- [ ] Backup automático do Postgres rodando
- [ ] Firewall (`ufw`) habilitado
- [ ] SSH sem login por senha (apenas chave) e sem login do root
- [ ] `git pull && docker compose up -d --build` testado uma vez
