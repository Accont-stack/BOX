// backend/server.js
// THE BOX - Backend API Principal
// ⚠️ Código SEGURO - User NUNCA vê este arquivo

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

dotenv.config();

const app = express();

// ===== MIDDLEWARES =====
app.use(express.json());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8000',
    'http://localhost:8080',
    '*' // Temporário para desenvolvimento
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - Proteção contra brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde'
});
app.use(limiter);

// ===== SUPABASE (Banco de Dados) =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ===== JWT UTILITIES =====
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_REFRESH = process.env.JWT_REFRESH_SECRET || 'dev-refresh-key-change-in-production';

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_REFRESH, { expiresIn: '7d' });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH);
  } catch {
    return null;
  }
};

// Middleware de autenticação
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const token = authHeader.slice(7);
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
  
  req.userId = decoded.userId;
  next();
};

// ===== ROTAS PÚBLICAS =====

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validação
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Verificar se email já existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: 'Email já registrado' });
    }
    
    // Criar usuário
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        name: name || email.split('@')[0],
        plan: 'free',
        status: 'active'
      })
      .select('id, email, name, plan')
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user,
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    // Verificar status
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Conta desativada' });
    }
    
    // Comparar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      },
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Refresh Token
app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }
    
    const newAccessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
});

// ===== ROTAS PROTEGIDAS =====

// Obter perfil
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, plan, status, created_at')
      .eq('id', req.userId)
      .single();
    
    if (error) throw error;
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar perfil
app.put('/api/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    
    const { data: user, error } = await supabase
      .from('users')
      .update({ name, updated_at: new Date() })
      .eq('id', req.userId)
      .select('id, email, name, plan')
      .single();
    
    if (error) throw error;
    
    res.json({ message: 'Perfil atualizado', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar transações
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .order('date', { ascending: false });
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data: transactions, error } = await query;
    
    if (error) throw error;
    
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar transação
app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { type, category, description, amount, date, device_id } = req.body;
    
    // Validação
    if (!type || !amount || !date) {
      return res.status(400).json({ error: 'Campos obrigatórios: type, amount, date' });
    }
    
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type deve ser "income" ou "expense"' });
    }
    
    // Verificar plano FREE
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', req.userId)
      .single();
    
    if (user.plan === 'free') {
      const { data: txCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact' })
        .eq('user_id', req.userId);
      
      if (txCount?.length >= 10) {
        return res.status(403).json({ 
          error: 'Limite de 10 transações atingido',
          message: 'Upgrade para PRO para transações ilimitadas'
        });
      }
    }
    
    // Criar transação
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.userId,
        type,
        category: category || 'Outros',
        description: description || '',
        amount: parseFloat(amount),
        date,
        device_id: device_id || 'unknown'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ 
      message: 'Transação criada',
      transaction 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar transação
app.put('/api/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, description, amount, date } = req.body;
    
    // Verificar se pertence ao usuário
    const { data: existing } = await supabase
      .from('transactions')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (existing?.user_id !== req.userId) {
      return res.status(403).json({ error: 'Não autorizado' });
    }
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update({ type, category, description, amount: parseFloat(amount), date, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ message: 'Transação atualizada', transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar transação
app.delete('/api/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se pertence ao usuário
    const { data: existing } = await supabase
      .from('transactions')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (existing?.user_id !== req.userId) {
      return res.status(403).json({ error: 'Não autorizado' });
    }
    
    await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    res.json({ message: 'Transação deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronização multi-dispositivo
app.post('/api/sync', authenticate, async (req, res) => {
  try {
    const { device_id, lastSync } = req.body;
    
    // Registrar/atualizar dispositivo
    await supabase
      .from('devices')
      .upsert({
        user_id: req.userId,
        device_id: device_id || 'unknown',
        last_sync: new Date()
      }, {
        onConflict: 'device_id'
      });
    
    // Buscar alterações desde último sync
    const syncDate = lastSync || '1970-01-01T00:00:00Z';
    const { data: changes, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .gt('updated_at', syncDate)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      status: 'synced',
      changes: changes || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas
app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, category')
      .eq('user_id', req.userId);
    
    if (error) throw error;
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const byCategory = {};
    transactions.forEach(t => {
      const cat = t.category || 'Outros';
      byCategory[cat] = (byCategory[cat] || 0) + (t.type === 'expense' ? t.amount : 0);
    });
    
    res.json({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      byCategory,
      transactionCount: transactions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== STRIPE WEBHOOK =====
app.post('/api/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const event = JSON.parse(req.body);
    
    switch(event.type) {
      case 'customer.subscription.updated':
        const { customer, status } = event.data.object;
        const plan = status === 'active' ? 'pro_monthly' : 'free';
        
        await supabase
          .from('users')
          .update({ plan })
          .eq('stripe_customer_id', customer);
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// ===== STRIPE CHECKOUT =====
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.post('/api/checkout', authenticate, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe não configurado' });
    }
    
    const { plan } = req.body;
    
    // Obter usuário
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // IDs dos produtos Stripe (você precisa atualizar com seus IDs reais)
    const priceIds = {
      monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1Sa74IAxkPjZykOAqT8xY5Zq',
      annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1Sa74IAxkPjZykOAqT8xY5Zq'
    };
    
    const priceId = priceIds[plan] || priceIds.monthly;
    
    // Criar sessão Stripe
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/index.html?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/index.html?canceled=true`,
      metadata: {
        userId: req.userId
      }
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Erro checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Erro interno do servidor' 
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
    ╔══════════════════════════════════════╗
    ║   🚀 THE BOX Backend - Server ON    ║
    ║   Port: ${PORT}                              ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
    ╚══════════════════════════════════════╝
  `);
});

export default app;
