-- ==============================================================================
-- FURIA Helpdesk - Script de Criação do Banco no Supabase (PostgreSQL)
-- ==============================================================================
-- Instruções:
-- 1. Acesse o seu projeto no Supabase (https://supabase.com).
-- 2. No menu lateral esquerdo, clique no ícone "SQL Editor" (>_).
-- 3. Cole todo o conteúdo deste script e clique no botão verde "Run" (Executar).
-- ==============================================================================

-- 1. Criação da tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'funcionario',
  department VARCHAR(50) DEFAULT 'Geral',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criação da tabela de Chamados / Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  categoria VARCHAR(50),
  local VARCHAR(50),
  tiposervico VARCHAR(50),
  descricao TEXT NOT NULL,
  urgencia VARCHAR(20) DEFAULT 'media',
  anexo TEXT,
  status VARCHAR(30) DEFAULT 'Recebido',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criação do Administrador padrão (senha: VAG2026@)
INSERT INTO users (id, nome, email, senha, role, department)
VALUES (
  'usr_admin',
  'Administrador FURIA',
  'admin@furia.gg',
  '1de491098043d5aa6efe7e28b3de9e0e3d4390002ee929f39f6a7b39863169d8',
  'admin',
  'Tecnologia & Operações'
)
ON CONFLICT (email) DO NOTHING;

-- 4. Criação do Técnico de suporte padrão (senha: TecFuria2026@)
INSERT INTO users (id, nome, email, senha, role, department)
VALUES (
  'usr_tecnico',
  'Técnico Suporte FURIA',
  'tecnico@furia.gg',
  'b139788244a2cbb2fa5d664a04ce20a5b2d5d4e082f1322c55ba4ed44c2a09c5',
  'tecnico',
  'Suporte Técnico & TI'
)
ON CONFLICT (email) DO NOTHING;

