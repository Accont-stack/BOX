# ✅ PASSO 1: SETUP SUPABASE (Banco de Dados)

## 🎯 Objetivo
Criar banco de dados PostgreSQL GRÁTIS na nuvem com Supabase

## ⏱️ Tempo: ~15 minutos

---

## PASSO 1.1: Criar Conta Supabase

### 1️⃣ Acesse o site
```
https://supabase.com
```

### 2️⃣ Clique em "Sign Up" (Canto superior direito)

### 3️⃣ Escolha uma opção:
- ✅ **GitHub** (Recomendado - mais rápido)
- Email + Senha

### 4️⃣ Autorize o Supabase (se usar GitHub)

### 5️⃣ Confirme seu email
Supabase vai enviar email de confirmação. Clique no link.

**Status:** ✅ Conta criada!

---

## PASSO 1.2: Criar um Novo Projeto

### 1️⃣ Após login, clique em "New Project"

### 2️⃣ Preencha os dados:

**Name:** `the-box` (ou seu nome)

**Database Password:** Crie uma senha FORTE
- Exemplo: `Sup@base2024!Seg0r@nça#`
- ⚠️ **NÃO esqueça desta senha!**
- Você precisará dela depois

**Region:** Escolha região mais próxima
- Se Brasil: Selecione `São Paulo (sa-east-1)`

**Pricing Plan:** `Free` (Recomendado para começar)

### 3️⃣ Clique em "Create new project"

⏳ **Aguarde 2-3 minutos** para criar...

Você verá:
```
[████████████████] 100%
Provisioning your database...
```

**Status:** ✅ Projeto criado!

---

## PASSO 1.3: Acessar o Painel

### Após criado, você verá o Dashboard com:

```
┌─────────────────────────────────────┐
│  THE BOX Supabase Project           │
├─────────────────────────────────────┤
│  Left sidebar:                      │
│  ├─ Home                            │
│  ├─ SQL Editor      ← CLIQUE AQUI   │
│  ├─ Tables                          │
│  ├─ Auth                            │
│  ├─ Realtime                        │
│  └─ Settings                        │
└─────────────────────────────────────┘
```

**Status:** ✅ Você tem acesso!

---

## PASSO 1.4: Obter Chaves de Configuração

### 1️⃣ Clique em "Settings" (Ícone de engrenagem)

### 2️⃣ No menu esquerdo, clique em "API"

### 3️⃣ Você verá:

```
┌─────────────────────────────────────┐
│ Project URL (SUPABASE_URL)          │
│ https://xxx.supabase.co             │ ← COPIE ISSO
├─────────────────────────────────────┤
│ Anon Key (SUPABASE_ANON_KEY)        │
│ eyJhbGc...                          │
├─────────────────────────────────────┤
│ Service Role Key (SUPABASE_KEY)     │
│ eyJhbGc...                          │ ← COPIE ISSO
│ (Clique em "Reveal")                │
└─────────────────────────────────────┘
```

### 4️⃣ COPIE estas duas informações:

**Abra seu arquivo** `c:\Users\Vip\Documents\BOX\.env`

E preencha:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJhbGc... (a chave completa do Service Role)
```

**Status:** ✅ Chaves obtidas e salvas!

---

## PASSO 1.5: Executar SQL para Criar Tabelas

### 1️⃣ No Supabase Dashboard, clique em "SQL Editor"

### 2️⃣ Clique em "New Query" (Botão azul)

### 3️⃣ Você verá um editor branco

### 4️⃣ Abra o arquivo local:
```
c:\Users\Vip\Documents\BOX\backend\database\schema.sql
```

### 5️⃣ COPIE TODO O CONTEÚDO do arquivo

### 6️⃣ COLE no editor do Supabase

### 7️⃣ Clique em "Run" (Botão azul com play ▶️)

⏳ **Aguarde executar...**

Você verá:
```
✅ Success!
15 statements executed
```

**Status:** ✅ Banco de dados criado com tabelas!

---

## PASSO 1.6: Verificar Tabelas Criadas

### 1️⃣ Clique em "Tables" (Menu esquerdo)

### 2️⃣ Você deve ver:
```
Tables
├─ users               ← Usuários
├─ transactions        ← Transações
├─ devices            ← Dispositivos
├─ api_keys           ← Chaves API
├─ audit_log          ← Histórico
├─ user_financial_summary   ← View
└─ expenses_by_category     ← View
```

Se vir essas tabelas = **✅ SUCESSO!**

---

## PASSO 1.7: Testar Conexão com Backend

### Atualizar `.env` local:

Abra: `c:\Users\Vip\Documents\BOX\.env`

```
# Supabase (Banco de Dados)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJhbGc...

# JWT (Use qualquer string longa)
JWT_SECRET=my-super-secret-key-change-in-production-2024
JWT_REFRESH_SECRET=my-super-refresh-key-change-in-production-2024

# Frontend
FRONTEND_URL=http://localhost:5173

# Ambiente
NODE_ENV=development
```

### Testar localmente:

```powershell
cd "c:\Users\Vip\Documents\BOX\backend"

# Instalar pacotes
npm install

# Rodar servidor
npm run dev

# Em outro terminal, testar
curl http://localhost:3000/api/health
```

Deve retornar:
```json
{
  "status": "OK",
  "environment": "development",
  "timestamp": "2024-12-03T10:30:00.000Z"
}
```

**Status:** ✅ Backend conectado ao banco!

---

## ✅ CHECKLIST - PASSO 1 COMPLETO

- [ ] Conta Supabase criada
- [ ] Projeto "the-box" criado
- [ ] SQL script executado (15 statements)
- [ ] Todas as 7 tabelas visíveis
- [ ] SUPABASE_URL copiada para `.env`
- [ ] SUPABASE_KEY copiada para `.env`
- [ ] Backend instalado (`npm install`)
- [ ] Backend rodando (`npm run dev`)
- [ ] Health check retorna OK

---

## 🔒 IMPORTANTE - Segurança

⚠️ **NUNCA** compartilhe suas chaves:
- ❌ Não coloque no GitHub público
- ❌ Não compartilhe em screenshots
- ❌ Não envie por chat público

✅ **FAÇA:**
- Guarde em `.env` (arquivo local)
- Coloque `.env` no `.gitignore` (já feito)
- Copie chaves para production depois

---

## 🆘 TROUBLESHOOTING

### Erro: "Failed to connect to database"
```
Solução:
1. Verificar SUPABASE_URL está correto
2. Verificar SUPABASE_KEY está completa
3. Testar conectividade do internet
```

### Erro: "SQL syntax error"
```
Solução:
1. Copiar EXATAMENTE todo o schema.sql
2. Não deixar linhas em branco antes
3. Executar com Run (não com Ctrl+Enter)
```

### Erro: "Table already exists"
```
Solução:
Significa que as tabelas já foram criadas.
É normal se executar 2x. Ignore o warning.
```

---

## 📞 Próximo Passo

Após completar este checklist, avise que o **PASSO 1 está completo**!

Então iremos para: **PASSO 2: CRIAR STRIPE (Pagamentos)**

---

## 🎓 O Que Você Fez

✅ Criou banco de dados PostgreSQL grátis
✅ Configurou tabelas de usuários e transações
✅ Conectou backend ao banco
✅ Testou e validou tudo

**Parabéns!** Seu banco de dados está **PRONTO E FUNCIONANDO**! 🚀

---

**Envie print do dashboard Supabase quando terminar para confirmar!** 📸
