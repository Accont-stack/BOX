# 🚀 THE BOX Backend API

Backend seguro e escalável para **THE BOX** - App de Gestão Financeira com IA.

## 🎯 Características

✅ **Autenticação JWT** - Tokens seguros com refresh  
✅ **Banco de Dados** - PostgreSQL (Supabase)  
✅ **Multi-dispositivo** - Sincronização em tempo real  
✅ **Pagamentos** - Integração com Stripe  
✅ **Rate Limiting** - Proteção contra brute force  
✅ **CORS Seguro** - Apenas frontend autorizado  
✅ **Escalável** - Deploy em Vercel, Railway, etc  

## 📋 Requisitos

- **Node.js** 18+
- **npm** ou **yarn**
- **Supabase** account (banco de dados)
- **Stripe** account (pagamentos)

## 🔧 Setup Local

### 1. Clone o repositório
```bash
git clone https://github.com/Accont-stack/BOX.git
cd BOX/backend
```

### 2. Instale dependências
```bash
npm install
```

### 3. Configure variáveis de ambiente
```bash
cp ../.env.example .env
```

Preencha o `.env` com:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-supabase
JWT_SECRET=sua-chave-super-segura
JWT_REFRESH_SECRET=outra-chave-super-segura
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 4. Execute localmente
```bash
npm run dev
```

Server estará em: `http://localhost:3000`

## 🔌 Endpoints Disponíveis

### Autenticação (Públicos)

#### Registrar
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123",
  "name": "John Doe"
}

# Response
{
  "message": "Usuário registrado com sucesso",
  "user": { "id": "uuid", "email": "...", "name": "..." },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}

# Response
{
  "message": "Login realizado com sucesso",
  "user": { "id": "uuid", "plan": "free" },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

#### Renovar Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_aqui"
}

# Response
{
  "accessToken": "novo_access_token"
}
```

### Perfil (Protegidos - Requerem autenticação)

#### Obter Perfil
```bash
GET /api/profile
Authorization: Bearer {accessToken}

# Response
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free",
    "status": "active",
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

#### Atualizar Perfil
```bash
PUT /api/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Novo Nome"
}
```

### Transações

#### Listar Transações
```bash
GET /api/transactions
Authorization: Bearer {accessToken}

# Query params (opcionais):
# ?startDate=2024-01-01&endDate=2024-12-31&category=Combustível

# Response
{
  "transactions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "expense",
      "category": "Combustível",
      "description": "Abasteci o carro",
      "amount": 150.50,
      "date": "2024-01-15",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Criar Transação
```bash
POST /api/transactions
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "type": "expense",
  "category": "Combustível",
  "description": "Abasteci o carro",
  "amount": 150.50,
  "date": "2024-01-15",
  "device_id": "device-uuid-opcional"
}

# Response - Status 201
{
  "message": "Transação criada",
  "transaction": { ...dados... }
}
```

#### Atualizar Transação
```bash
PUT /api/transactions/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "type": "expense",
  "amount": 160.00,
  "description": "Novo descrição"
}
```

#### Deletar Transação
```bash
DELETE /api/transactions/{id}
Authorization: Bearer {accessToken}

# Response
{
  "message": "Transação deletada"
}
```

### Sincronização Multi-dispositivo

#### Sincronizar
```bash
POST /api/sync
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "device_id": "device-uuid",
  "lastSync": "2024-01-15T10:00:00Z"
}

# Response
{
  "status": "synced",
  "changes": [...transações alteradas...],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Estatísticas

#### Obter Stats
```bash
GET /api/stats
Authorization: Bearer {accessToken}

# Response
{
  "totalIncome": 5000.00,
  "totalExpense": 2500.00,
  "balance": 2500.00,
  "byCategory": {
    "Combustível": 500.00,
    "Alimentação": 1000.00,
    "Outros": 1000.00
  },
  "transactionCount": 25
}
```

### Sistema (Público)

#### Health Check
```bash
GET /api/health

# Response
{
  "status": "OK",
  "environment": "production",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔐 Autenticação

Todas as rotas protegidas requerem header:
```
Authorization: Bearer {accessToken}
```

**Tokens:**
- `accessToken`: Válido por 30 minutos
- `refreshToken`: Válido por 7 dias

Quando `accessToken` expirar, use `refreshToken` para obter novo.

## 🗄️ Banco de Dados

### Tabelas
- `users` - Dados de usuários
- `transactions` - Transações financeiras
- `devices` - Dispositivos sincronizados
- `api_keys` - Para integração
- `audit_log` - Histórico de ações

### Para Inicializar DB

1. Acesse Supabase Dashboard
2. SQL Editor
3. Execute: `backend/database/schema.sql`

## 💳 Integração Stripe

### Setup

1. Dashboard Stripe → API Keys
2. Copie `STRIPE_SECRET_KEY` (sk_...)
3. Crie Products com Prices:
   - PRO_MONTHLY: R$ 29,90/mês
   - PRO_ANNUAL: R$ 287,28/ano

### Webhook Stripe

Configure em: Dashboard → Webhooks

URL: `https://seu-dominio.com/api/webhook/stripe`

Eventos:
- `customer.subscription.created`
- `customer.subscription.updated`
- `invoice.payment_succeeded`

## 🧪 Testes

```bash
# Teste de login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"senha123"}'

# Teste de transação
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"expense",
    "category":"Teste",
    "amount":100,
    "date":"2024-01-15"
  }'
```

## 📊 Monitoramento

### Logs Locais
```bash
npm run dev  # Ver logs em tempo real
```

### Em Produção
- Vercel: `vercel logs`
- Railway: Dashboard → Logs
- Sentry: `https://sentry.io/` (opcional)

## 🚀 Deploy

Veja [DEPLOYMENT.md](../DEPLOYMENT.md) para instruções completas.

**Quick deploy Vercel:**
```bash
npm install -g vercel
vercel --prod
```

## 🐛 Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "Database connection error"
- Verificar `SUPABASE_URL` e `SUPABASE_KEY`
- Confirmar que tabelas foram criadas

### "CORS error"
- Verificar `FRONTEND_URL` no `.env`

### Rate limit atingido
- Aumentar `max` em rate limiter
- Ou adicionar API key para bypass

## 📚 Documentação

- [Monetização & Arquitetura](../MONETIZACAO_E_ARQUITETURA.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe API](https://stripe.com/docs/api)

## 📄 Licença

MIT - Veja [LICENSE](../LICENSE)

## 🤝 Contribuir

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit (`git commit -m 'Add MinhaFeature'`)
4. Push (`git push origin feature/MinhaFeature`)
5. Abra Pull Request

## 📞 Suporte

- Issues: GitHub Issues
- Email: suporte@thebox.app
- Discord: [Link do servidor]

---

**THE BOX Backend v1.0.0** ✨
