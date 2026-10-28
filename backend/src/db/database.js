/**
 * ==============================================================================
 * FURIA Helpdesk - Banco de Dados SQLite3 Nativo (Node.js 24 node:sqlite)
 * ==============================================================================
 * O arquivo database.sqlite guarda TODOS os dados do sistema.
 * Suporta visualização e edição direta com o SQLite3 Editor / SQLite Viewer no VS Code.
 */

import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../database.sqlite');

// Inicialização da conexão SQLite
export const db = new DatabaseSync(DB_PATH);

// Habilita foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Criação das tabelas com o esquema oficial do projeto
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'funcionario',
  department VARCHAR(50) DEFAULT 'Geral',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  categoria VARCHAR(50),
  local VARCHAR(50),
  tiposervico VARCHAR(50),
  descricao TEXT NOT NULL,
  urgencia VARCHAR(20) DEFAULT 'media',
  anexo VARCHAR(255),
  status VARCHAR(30) DEFAULT 'Recebido',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Função para hash seguro de senha em SHA-256
export function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password).trim()).digest('hex');
}

// Compara a senha digitada com a gravada (suporta tanto hash SHA-256 quanto texto puro caso editado manualmente no SQLite Editor)
export function comparePassword(inputPassword, storedValue) {
  const cleanInput = String(inputPassword).trim();
  const cleanStored = String(storedValue).trim();
  return hashPassword(cleanInput) === cleanStored || cleanInput === cleanStored;
}

// Cria o Administrador de teste padrão caso a tabela users esteja sem ele
(function seedAdmin() {
  const check = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@furia.gg');
  if (!check) {
    db.prepare(`
      INSERT INTO users (id, nome, email, senha, role, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'usr_admin',
      'Administrador FURIA',
      'admin@furia.gg',
      hashPassword('admin'),
      'admin',
      'Tecnologia & Operações'
    );
    console.log('> Administrador padrão criado: admin@furia.gg (senha: admin)');
  }
})();

// Formatador seguro de usuário (remove a senha antes de enviar para o cliente)
function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.nome,
    nome: row.nome,
    email: row.email,
    role: row.role,
    department: row.department,
    createdAt: row.created_at,
    created_at: row.created_at
  };
}

// Formatador de chamados
function formatTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    userName: row.user_name,
    user_name: row.user_name,
    userEmail: row.user_email,
    user_email: row.user_email,
    tipo: row.tipo,
    titulo: row.titulo,
    categoria: row.categoria,
    local: row.local,
    tiposervico: row.tiposervico,
    descricao: row.descricao,
    urgencia: row.urgencia,
    anexo: row.anexo,
    status: row.status,
    data: row.created_at,
    created_at: row.created_at
  };
}

export const Database = {
  // --- OPERAÇÕES DE USUÁRIOS ---
  async findUsers() {
    const rows = db.prepare('SELECT id, nome, email, role, department, created_at FROM users ORDER BY created_at DESC').all();
    return rows.map(formatUser);
  },

  async findUserById(id) {
    const row = db.prepare('SELECT id, nome, email, role, department, created_at FROM users WHERE id = ?').get(id);
    return formatUser(row);
  },

  async findUserByEmail(email) {
    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!row) return null;
    return {
      ...formatUser(row),
      senha: row.senha,
      password: row.senha
    };
  },

  async createUser({ name, nome, email, password, senha, role = 'funcionario', department = 'Geral' }) {
    const cleanEmail = String(email).trim().toLowerCase();
    const finalName = String(name || nome || '').trim();
    const finalPass = hashPassword(password || senha || '123');
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      db.prepare(`
        INSERT INTO users (id, nome, email, senha, role, department)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, finalName, cleanEmail, finalPass, role, department);

      return this.findUserById(id);
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        throw new Error('Este e-mail já está cadastrado no sistema.');
      }
      throw err;
    }
  },

  async updateUser(id, { name, nome, department, role }) {
    const current = await this.findUserById(id);
    if (!current) throw new Error('Usuário não encontrado.');

    const newName = name || nome || current.name;
    const newDept = department || current.department;
    const newRole = role || current.role;

    db.prepare(`
      UPDATE users SET nome = ?, department = ?, role = ? WHERE id = ?
    `).run(newName, newDept, newRole, id);

    return this.findUserById(id);
  },

  async deleteUser(id) {
    const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (res.changes === 0) throw new Error('Usuário não encontrado.');
    return true;
  },

  // --- OPERAÇÕES DE TICKETS / CHAMADOS ---
  async findTickets(filter = {}) {
    let sql = 'SELECT * FROM tickets';
    const params = [];
    const clauses = [];

    if (filter.userId) {
      clauses.push('user_id = ?');
      params.push(filter.userId);
    }

    if (filter.status) {
      clauses.push('LOWER(status) = LOWER(?)');
      params.push(filter.status);
    }

    if (clauses.length > 0) {
      sql += ' WHERE ' + clauses.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const rows = db.prepare(sql).all(...params);
    return rows.map(formatTicket);
  },

  async findTicketById(id) {
    const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    return formatTicket(row);
  },

  async createTicket(data) {
    const id = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = data.userId || data.user_id || 'usr_admin';
    const userName = data.userName || data.user_name || 'Usuário';
    const userEmail = data.userEmail || data.user_email || 'usuario@furia.gg';
    const tipo = data.tipo || 'problemas';
    const titulo = data.titulo || 'Chamado Técnico';
    const categoria = data.categoria || 'Geral';
    const local = data.local || '';
    const tiposervico = data.tiposervico || '';
    const descricao = data.descricao || '';
    const urgencia = data.urgencia || 'media';
    const anexo = data.anexo || null;
    const status = 'Recebido';

    db.prepare(`
      INSERT INTO tickets (
        id, user_id, user_name, user_email, tipo, titulo,
        categoria, local, tiposervico, descricao, urgencia, anexo, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, userName, userEmail, tipo, titulo, categoria, local, tiposervico, descricao, urgencia, anexo, status);

    return this.findTicketById(id);
  },

  async updateTicketStatus(id, status) {
    const res = db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(status, id);
    if (res.changes === 0) throw new Error('Chamado não encontrado.');
    return this.findTicketById(id);
  },

  async deleteTicket(id) {
    const res = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
    if (res.changes === 0) throw new Error('Chamado não encontrado.');
    return true;
  }
};

