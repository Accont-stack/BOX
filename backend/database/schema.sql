-- backend/database/schema.sql
-- THE BOX - Schema PostgreSQL (Supabase)
-- Execute este arquivo no Supabase SQL Editor

-- ===== TABELA: USERS =====
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  
  -- Plano
  plan VARCHAR(50) DEFAULT 'free', -- free, pro_monthly, pro_annual, enterprise
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, deleted
  
  -- Stripe
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  expires_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT email_unique UNIQUE(email)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
CREATE INDEX idx_users_status ON users(status);

-- ===== TABELA: TRANSACTIONS =====
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dados da transação
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  
  -- Dispositivo
  device_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ===== TABELA: DEVICES =====
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  device_id VARCHAR(255) UNIQUE NOT NULL,
  device_name VARCHAR(255),
  
  last_sync TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);

-- ===== TABELA: API_KEYS (Para integração) =====
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);

-- ===== TABELA: AUDIT_LOG =====
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(255),
  resource VARCHAR(100),
  resource_id VARCHAR(255),
  changes JSONB,
  
  ip_address VARCHAR(255),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ===== FUNÇÃO: UPDATE UPDATED_AT =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== VIEWS ÚTEIS =====

-- View: Resumo financeiro por usuário
CREATE OR REPLACE VIEW user_financial_summary AS
SELECT
  u.id,
  u.email,
  u.plan,
  COUNT(CASE WHEN t.type = 'income' THEN 1 END) as income_count,
  COUNT(CASE WHEN t.type = 'expense' THEN 1 END) as expense_count,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.email, u.plan;

-- View: Gastos por categoria
CREATE OR REPLACE VIEW expenses_by_category AS
SELECT
  user_id,
  category,
  COUNT(*) as count,
  SUM(amount) as total,
  AVG(amount) as average
FROM transactions
WHERE type = 'expense'
GROUP BY user_id, category;

-- ===== ROW LEVEL SECURITY (RLS) =====
-- Adicionar RLS para segurança (usuários veem só seus dados)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para transactions
CREATE POLICY "Usuários veem suas próprias transações"
  ON transactions
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem inserir suas próprias transações"
  ON transactions
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem atualizar suas próprias transações"
  ON transactions
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para devices
CREATE POLICY "Usuários veem seus próprios dispositivos"
  ON devices
  USING (auth.uid()::text = user_id::text);

-- Políticas para api_keys
CREATE POLICY "Usuários veem suas próprias API keys"
  ON api_keys
  USING (auth.uid()::text = user_id::text);

-- ===== DADOS DE TESTE (opcional) =====
-- INSERT INTO users (email, password_hash, name, plan) 
-- VALUES ('admin@test.com', '$2a$10$...', 'Admin Test', 'pro_annual');
