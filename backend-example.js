// backend/server.js
// THE BOX - Backend API
// Código SEGURO no servidor - User NUNCA vê

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// ✅ MIDDLEWARES
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://seudominio.com',
  credentials: true
}));

// Rate limiting - Protege contra brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde'
});
app.use(limiter);

// ✅ BANCO DE DADOS (Supabase/PostgreSQL)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ✅ AUTENTICAÇÃO JWT
const generateToken = (userId, expiresIn = '30m') => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware de autenticação
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Token inválido' });
  
  req.userId = decoded.userId;
  next();
};

// ✅ ROTAS PÚBLICAS

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validação
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha obrigatórios' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Salvar no banco
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          name,
          plan: 'free',
          status: 'active'
        }
      ])
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const user = data[0];
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuário
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, data.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    const accessToken = generateToken(data.id);
    const refreshToken = generateRefreshToken(data.id);
    
    res.json({
      message: 'Login realizado com sucesso',
      user: { id: data.id, email: data.email, name: data.name, plan: data.plan },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh Token
app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = generateToken(decoded.userId);
    
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
});

// ✅ ROTAS PROTEGIDAS (Requerem autenticação)

// Obter transações do usuário
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    res.json({ transactions: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar transação
app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { type, category, description, amount, date, device_id } = req.body;
    
    // Validar plano
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', req.userId)
      .single();
    
    if (user.plan === 'free') {
      // Verificar limite de 10 transações
      const { data: txs } = await supabase
        .from('transactions')
        .select('count', { count: 'exact' })
        .eq('user_id', req.userId);
      
      if (txs.length >= 10) {
        return res.status(403).json({ error: 'Limite de transações atingido. Upgrade para PRO!' });
      }
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: req.userId,
          type,
          category,
          description,
          amount: parseFloat(amount),
          date,
          device_id
        }
      ])
      .select();
    
    if (error) throw error;
    
    res.status(201).json({
      message: 'Transação criada',
      transaction: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter perfil do usuário
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, plan, status, created_at')
      .eq('id', req.userId)
      .single();
    
    if (error) throw error;
    
    res.json({ user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ STRIPE WEBHOOK (Para pagamentos)
app.post('/api/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = req.body; // Em produção: usar stripe.webhooks.constructEvent()
    
    if (event.type === 'customer.subscription.updated') {
      const { customer, subscription_id } = event.data.object;
      
      // Atualizar plano do usuário
      await supabase
        .from('users')
        .update({ plan: 'pro_monthly', subscription_id })
        .eq('stripe_customer_id', customer);
    }
    
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ SYNC MULTI-DISPOSITIVO
app.post('/api/sync', authenticate, async (req, res) => {
  try {
    const { device_id, last_sync } = req.body;
    
    // Registrar dispositivo
    await supabase
      .from('devices')
      .upsert(
        { user_id: req.userId, device_id, last_sync: new Date() },
        { onConflict: 'device_id' }
      );
    
    // Buscar transações desde o último sync
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .gt('updated_at', last_sync || '1970-01-01')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      status: 'synced',
      changes: data,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ✅ INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 THE BOX Backend rodando em http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
