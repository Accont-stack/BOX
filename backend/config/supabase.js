// backend/config/supabase.js
// Configuração Supabase (PostgreSQL na Nuvem)

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Função para criar tabelas (rodar uma única vez)
export async function initializeDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
    // Tabela Users
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError && !usersError.message.includes('already exists')) {
      console.error('Erro ao criar tabela users:', usersError);
    }
    
    console.log('✅ Banco de dados inicializado');
  } catch (error) {
    console.error('Erro ao inicializar DB:', error);
  }
}

export default supabase;
