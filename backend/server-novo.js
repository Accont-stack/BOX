// backend/server.js - Versão simplificada e funcional
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

// ===== CONFIGURAÇÕES =====
app.use(express.json());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== SUPABASE =====
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://hjzpajjyiobfouclrxzs.supabase.co',
  process.env.SUPABASE_KEY || 'sb_secret_fy6ohI-MtcwlThSUqYIx8Q_-wdLP2f_'
);

// ===== JWT =====
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-2024';
const JWT_REFRESH = process.env.JWT_REFRESH_SECRET || 'dev-refresh-key-2024';

const generateAccessToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30m' });
const generateRefreshToken = (userId) => jwt.sign({ userId }, JWT_REFRESH, { expiresIn: '7d' });

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// ===== ROTAS PÚBLICAS =====

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// REGISTRAR
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Verificar se usuário existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Criar usuário
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        name: name || email,
        plan: 'free'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);
    
    res.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan
      },
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Erro registro:', error);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!user || !(await bcryptjs.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      },
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Erro login:', error);
    res.status(500).json({ error: error.message });
  }
});

// REFRESH TOKEN
app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, JWT_REFRESH);
    const newAccessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
});

// ===== ROTAS PROTEGIDAS =====

// GET TRANSAÇÕES
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .order('date', { ascending: false });
    
    res.json({ transactions: transactions || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE TRANSAÇÃO
app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { type, category, description, amount, date } = req.body;
    
    const { data: tx, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.userId,
        type,
        category,
        description,
        amount,
        date
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.json({ transaction: tx });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE TRANSAÇÃO
app.delete('/api/transactions/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);
    
    if (error) throw error;
    res.json({ message: 'Deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET STATS
app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId);
    
    const totalIncome = (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((a, b) => a + b.amount, 0);
    
    const totalExpense = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((a, b) => a + b.amount, 0);
    
    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// STRIPE CHECKOUT
app.post('/api/checkout', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe não configurado' });
    }
    
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.userId)
      .single();
    
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    const priceIds = {
      monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_test_monthly',
      annual: process.env.STRIPE_PRICE_ANNUAL || 'price_test_annual'
    };
    
    const priceId = priceIds[plan] || priceIds.monthly;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const params = new URLSearchParams();
    params.append('customer_email', user.email);
    params.append('payment_method_types[]', 'card');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('mode', 'subscription');
    params.append('success_url', `${frontendUrl}/index.html?success=true`);
    params.append('cancel_url', `${frontendUrl}/index.html?canceled=true`);
    params.append('metadata[userId]', req.userId);
    
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Stripe error:', error);
      return res.status(response.status).json({ error: 'Erro ao criar sessão' });
    }
    
    const session = await response.json();
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Erro checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  ✅ THE BOX BACKEND - READY            ║
║  Port: ${PORT}                                 ║
║  URL: http://localhost:${PORT}                   ║
╚════════════════════════════════════════╝
  `);
});

export default app;
