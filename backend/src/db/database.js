/**
 * Camada de Dados - SQLite3 Nativo (Node.js 24 node:sqlite)
 *
 * Utiliza o arquivo SQLite `backend/database.sqlite` diretamente compatível
 * com extensões do VS Code (SQLite Viewer/Editor, SQLite3 Editor) e softwares
 * como DB Browser for SQLite.
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

// Habilita chaves estrangeiras
db.exec('PRAGMA foreign_keys = ON;');

// Criação das tabelas conforme esquema SQL do projeto
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

// Função de hash SHA-256 para senhas
export function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password).trim()).digest('hex');
}

/**
 * Valida a senha digitada.
 * Aceita tanto o hash SHA-256 quanto a senha em texto puro caso
 * tenha sido inserida diretamente por você no SQLite3 Editor.
 */
export function comparePassword(inputPassword, storedValue) {
  const cleanInput = String(inputPassword).trim();
  const cleanStored = String(storedValue).trim();
  return hashPassword(cleanInput) === cleanStored || cleanInput === cleanStored;
}

// Inicializa o Administrador padrão se a tabela de usuários estiver sem ele
(function seedAdmin() {
  const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existing = checkStmt.get('admin@furia.gg');

  if (!existing) {
    const insertAdmin = db.prepare(`
      INSERT INTO users (id, nome, email, senha, role, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run(
      'usr_admin',
      'Administrador FURIA',
      'admin@furia.gg',
      hashPassword('admin'),
      'admin',
      'Tecnologia & Operações'
    );
    console.log('⚡ Administrador de teste padrão criado no SQLite (admin@furia.gg / admin)');
  }
})();

// Helper para formatar usuário de forma segura (sem senha)
function formatSafeUser(row) {
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

// Helper para formatar chamados com suporte dual (camelCase e snake_case)
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
    createdAt: row.created_at,
    created_at: row.created_at
  };
}

export const Database = {
  // --- MÉTODOS DE USUÁRIOS ---
  async findUsers() {
    const stmt = db.prepare('SELECT id, nome, email, role, department, created_at FROM users ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map(formatSafeUser);
  },

  async findUserByEmail(email) {
    if (!email) return null;
    const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
    const row = stmt.get(email.trim());
    if (!row) return null;
    return {
      ...formatSafeUser(row),
      senha: row.senha,
      password: row.senha
    };
  },

  async findUserById(id) {
    if (!id) return null;
    const stmt = db.prepare('SELECT id, nome, email, role, department, created_at FROM users WHERE id = ?');
    const row = stmt.get(id);
    return formatSafeUser(row);
  },

  async createUser(userData) {
    const cleanEmail = String(userData.email).trim().toLowerCase();
    const nome = String(userData.nome || userData.name || '').trim();
    const senhaRaw = userData.senha || userData.password || '123';
    const senha = hashPassword(senhaRaw);
    const role = userData.role || 'funcionario';
    const department = userData.department || 'Geral';
    const id = userData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      const stmt = db.prepare(`
        INSERT INTO users (id, nome, email, senha, role, department)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, nome, cleanEmail, senha, role, department);
      return this.findUserById(id);
    } catch (error) {
      if (String(error.message).includes('UNIQUE') || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Este e-mail já está cadastrado no sistema.');
      }
      throw error;
    }
  },

  async updateUser(id, updates) {
    const current = await this.findUserById(id);
    if (!current) throw new Error('Usuário não encontrado.');

    const newNome = updates.nome || updates.name || current.nome;
    const newRole = updates.role || current.role;
    const newDept = updates.department || current.department;

    const stmt = db.prepare(`
      UPDATE users
      SET nome = ?, role = ?, department = ?
      WHERE id = ?
    `);
    stmt.run(newNome, newRole, newDept, id);

    return this.findUserById(id);
  },

  async updateUserRole(id, role) {
    const current = await this.findUserById(id);
    if (!current) throw new Error('Usuário não encontrado.');

    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    stmt.run(role, id);

    return this.findUserById(id);
  },

  async deleteUser(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) throw new Error('Usuário não encontrado.');
    return true;
  },

  // --- MÉTODOS DE TICKETS / CHAMADOS ---
  async findTickets(filter = {}) {
    let sql = 'SELECT * FROM tickets';
    const params = [];
    const clauses = [];

    if (filter.userId || filter.user_id) {
      clauses.push('user_id = ?');
      params.push(filter.userId || filter.user_id);
    }

    if (filter.status) {
      clauses.push('LOWER(status) = LOWER(?)');
      params.push(filter.status);
    }

    if (clauses.length > 0) {
      sql += ' WHERE ' + clauses.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map(formatTicket);
  },

  async findTicketById(id) {
    const stmt = db.prepare('SELECT * FROM tickets WHERE id = ?');
    const row = stmt.get(id);
    return formatTicket(row);
  },

  async createTicket(ticketData) {
    const id = ticketData.id || `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = ticketData.userId || ticketData.user_id || 'usr_anon';
    const userName = ticketData.userName || ticketData.user_name || 'Usuário';
    const userEmail = ticketData.userEmail || ticketData.user_email || 'usuario@furia.gg';
    const tipo = ticketData.tipo || 'problemas';
    const titulo = ticketData.titulo || (tipo === 'presencial' ? 'Chamado Presencial' : 'Relato de Problema');
    const categoria = ticketData.categoria || 'Geral';
    const local = ticketData.local || '';
    const tiposervico = ticketData.tiposervico || '';
    const descricao = ticketData.descricao || '';
    const urgencia = ticketData.urgencia || 'media';
    const anexo = ticketData.anexo || null;
    const status = ticketData.status || 'Recebido';

    const stmt = db.prepare(`
      INSERT INTO tickets (
        id, user_id, user_name, user_email, tipo, titulo,
        categoria, local, tiposervico, descricao, urgencia, anexo, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, userId, userName, userEmail, tipo, titulo,
      categoria, local, tiposervico, descricao, urgencia, anexo, status
    );

    return this.findTicketById(id);
  },

  async updateTicketStatus(id, newStatus) {
    const stmt = db.prepare('UPDATE tickets SET status = ? WHERE id = ?');
    const result = stmt.run(newStatus, id);
    if (result.changes === 0) throw new Error('Chamado não encontrado.');
    return this.findTicketById(id);
  },

  async deleteTicket(id) {
    const stmt = db.prepare('DELETE FROM tickets WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) throw new Error('Chamado não encontrado.');
    return true;
  }
};
