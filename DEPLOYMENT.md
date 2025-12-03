# 🚀 THE BOX Backend - Guia de Deployment

## Opção 1: Vercel (Recomendado - Grátis)

### Setup Vercel

1. **Criar conta:** https://vercel.com (use GitHub para facilitar)

2. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

3. **Deploy Backend:**
```bash
cd backend
vercel
# Seguir instruções
```

4. **Configurar variáveis de ambiente:**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
vercel env add JWT_SECRET
# ... adicionar outras
```

### Custo Vercel
- **Free tier:** 100 requisições grátis, depois $0.50 por 100k requisições
- **Inclui:** HTTPS, CI/CD, logs, analytics

---

## Opção 2: Railway (Fácil + Barato)

1. **Criar conta:** https://railway.app

2. **Conectar GitHub:** Link seu repositório

3. **Deploy automático:**
   - Railway detecta Node.js automaticamente
   - Faz deploy a cada push no GitHub

4. **Variáveis de ambiente:**
   - Settings → Variables
   - Copie do `.env`

### Custo Railway
- **Free:** $5/mês crédito
- **Pago:** $0.50/hora de uptime (muito barato)

---

## Opção 3: Heroku (Mais caro, mas tradicional)

```bash
# Login
heroku login

# Criar app
heroku create the-box-backend

# Adicionar variáveis
heroku config:set SUPABASE_URL=xxx

# Deploy
git push heroku main
```

### Custo Heroku
- **Free:** Suspenso (Heroku encerrou free tier)
- **Pago:** $7+/mês

---

## Pré-requisitos

### 1. Supabase Setup (Banco de Dados - Grátis)

1. Acesse https://supabase.com
2. Crie nova conta (use GitHub)
3. Crie novo projeto
4. Copie `SUPABASE_URL` e `SUPABASE_KEY`
5. Vá para SQL Editor e execute: `backend/database/schema.sql`

### 2. Stripe Setup (Pagamentos - Teste Grátis)

1. Acesse https://stripe.com
2. Crie conta
3. Vá para Dashboard → API Keys
4. Copie `STRIPE_SECRET_KEY`
5. Crie Prices em: Dashboard → Products

**Prices recomendados:**
- `PRO_MONTHLY`: R$ 29,90/mês (lookup_key: `pro_monthly`)
- `PRO_ANNUAL`: R$ 287,28/ano (lookup_key: `pro_annual`)

---

## Passos para Deploy (Resumido)

### 1. Preparar código
```bash
cd backend
npm install
npm test  # Se tiver testes
```

### 2. Variáveis de Ambiente (Produção)
```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=chave_supabase
JWT_SECRET=chave_secreta_super_longa_aleatoria
JWT_REFRESH_SECRET=outra_chave_super_longa_aleatoria
STRIPE_SECRET_KEY=sk_live_...
FRONTEND_URL=https://seu-dominio.com
NODE_ENV=production
```

### 3. Deploy Vercel (Passo a Passo)

```bash
# 1. Instalar CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Configurar variáveis no dashboard Vercel
# Settings → Environment Variables → Add
```

### 4. Testar Deploy

```bash
# Verificar health
curl https://seu-app.vercel.app/api/health

# Testar login
curl -X POST https://seu-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

---

## Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
vercel deploy --prod
```

### Erro: Database connection
```bash
# Verificar SUPABASE_URL e SUPABASE_KEY
vercel env ls
vercel env add SUPABASE_URL https://seu-projeto.supabase.co
```

### Rate limiting muito alto
```javascript
// Aumentar no backend/server.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000  // Aumentado
});
```

---

## Monitoramento

### Logs Vercel
```bash
vercel logs [app-name]
```

### Sentry (Erro reporting - Grátis)
1. Criar conta em https://sentry.io
2. Adicionar SDK:
```bash
npm install @sentry/node
```
3. Configurar no server.js

---

## CI/CD com GitHub Actions

Criar arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: backend
```

---

## Checklist Final

- [ ] Supabase criado e tables criadas
- [ ] Stripe account criado com prices
- [ ] `.env` preenchido com todas as chaves
- [ ] Node packages instalados (`npm install`)
- [ ] Código testado localmente (`npm run dev`)
- [ ] Repository sincronizado com GitHub
- [ ] Vercel/Railway configurado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy realizado
- [ ] Health check respondendo
- [ ] Testes de autenticação OK
- [ ] Monitoramento configurado

---

## Domínio Customizado

Se quiser usar `api.seudominio.com`:

### Vercel
1. Settings → Domains
2. Add: `api.seudominio.com`
3. Seguir instruções de DNS

### Railway
1. Settings → Domain
2. Add: `api.seudominio.com`
3. Apontar CNAME para Railway

---

## Próximos Passos

1. ✅ Fazer deploy do backend
2. ✅ Conectar frontend ao backend (update API URL)
3. ✅ Testar fluxo completo (register → login → transações)
4. ✅ Setup Stripe webhooks
5. ✅ Criar landing page com pricing
6. ✅ Marketing & Growth 🚀

---

**Backend pronto para ir ao ar!** 🎉
