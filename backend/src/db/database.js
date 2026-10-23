/**
 * Camada de Acesso a Dados / Banco de Dados (Database Layer)
 * 
 * Este arquivo foi estruturado de forma modular para que você possa conectar
 * facilmente seu banco de dados favorito (SQLite, PostgreSQL, MySQL, MongoDB ou Prisma).
 * 
 * Por padrão, inclui um repositório em memória/arquivo totalmente funcional,
 * permitindo que a API rode imediatamente sem necessidade de configurações extras.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// Função para hash seguro de senha utilizando crypto nativo do Node
export function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password).trim()).digest('hex');
}

export function comparePassword(inputPassword, storedHash) {
  return hashPassword(inputPassword) === storedHash;
}

/**
 * ESQUEMA SQL SUGERIDO PARA QUANDO VOCÊ FOR CONECTAR SEU BANCO:
 * 
 * CREATE TABLE users (
 *   id VARCHAR(50) PRIMARY KEY,
 *   name VARCHAR(100) NOT NULL,
 *   email VARCHAR(100) UNIQUE NOT NULL,
 *   password VARCHAR(255) NOT NULL,
 *   role VARCHAR(20) NOT NULL DEFAULT 'funcionario', -- 'funcionario', 'tecnico', 'admin'
 *   department VARCHAR(50) DEFAULT 'Geral',
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * CREATE TABLE tickets (
 *   id VARCHAR(50) PRIMARY KEY,
 *   user_id VARCHAR(50) NOT NULL,
 *   user_name VARCHAR(100) NOT NULL,
 *   user_email VARCHAR(100) NOT NULL,
 *   tipo VARCHAR(30) NOT NULL, -- 'problemas', 'presencial'
 *   titulo VARCHAR(150) NOT NULL,
 *   categoria VARCHAR(50),
 *   local VARCHAR(50),
 *   tiposervico VARCHAR(50),
 *   descricao TEXT NOT NULL,
 *   urgencia VARCHAR(20) DEFAULT 'media',
 *   anexo VARCHAR(255),
 *   status VARCHAR(30) DEFAULT 'Recebido', -- 'Recebido', 'Em andamento', 'Concluído'
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 */

// Dados iniciais: apenas o Administrador de teste
const SEED_DATA = {
  users: [
    {
      id: 'usr_admin',
      name: 'Administrador FURIA',
      email: 'admin@furia.gg',
      password: hashPassword('admin'),
      role: 'admin',
      department: 'Tecnologia & Operações',
      createdAt: new Date().toISOString()
    }
  ],
  tickets: []
};

// Carrega ou inicializa a base de dados
function loadData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // se falhar leitura, usa seed
  }
  saveData(SEED_DATA);
  return JSON.parse(JSON.stringify(SEED_DATA));
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Aviso ao persistir dados no arquivo:', err.message);
  }
}

let db = loadData();

export const Database = {
  // --- MÉTODOS DE USUÁRIOS ---
  async findUsers() {
    return db.users.map(({ password, ...user }) => user);
  },

  async findUserByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    return db.users.find(u => u.email.toLowerCase() === clean) || null;
  },

  async findUserById(id) {
    const user = db.users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async createUser(userData) {
    const cleanEmail = userData.email.trim().toLowerCase();
    if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: userData.name.trim(),
      email: cleanEmail,
      password: hashPassword(userData.password),
      role: userData.role || 'funcionario',
      department: userData.department || 'Geral',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveData(db);

    const { password, ...safeUser } = newUser;
    return safeUser;
  },

  async updateUser(id, updates) {
    const user = db.users.find(u => u.id === id);
    if (!user) throw new Error('Usuário não encontrado.');
    if (updates.role) user.role = updates.role;
    if (updates.department) user.department = updates.department;
    if (updates.name) user.name = updates.name;
    saveData(db);
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async updateUserRole(id, role) {
    const user = db.users.find(u => u.id === id);
    if (!user) throw new Error('Usuário não encontrado.');
    user.role = role;
    saveData(db);
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async deleteUser(id) {
    const initialLength = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    if (db.users.length === initialLength) throw new Error('Usuário não encontrado.');
    saveData(db);
    return true;
  },

  // --- MÉTODOS DE TICKETS ---
  async findTickets(filter = {}) {
    let results = [...db.tickets];
    if (filter.userId) {
      results = results.filter(t => t.userId === filter.userId);
    }
    if (filter.status) {
      results = results.filter(t => t.status.toLowerCase() === filter.status.toLowerCase());
    }
    return results;
  },

  async findTicketById(id) {
    return db.tickets.find(t => t.id === id) || null;
  },

  async createTicket(ticketData) {
    const newTicket = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: ticketData.userId,
      userName: ticketData.userName,
      userEmail: ticketData.userEmail,
      tipo: ticketData.tipo || 'problemas',
      titulo: ticketData.titulo || 'Solicitação de Suporte',
      categoria: ticketData.categoria || 'Geral',
      local: ticketData.local || '',
      tiposervico: ticketData.tiposervico || '',
      descricao: ticketData.descricao || '',
      urgencia: ticketData.urgencia || 'media',
      anexo: ticketData.anexo || null,
      status: 'Recebido',
      data: new Date().toISOString()
    };

    db.tickets.unshift(newTicket);
    saveData(db);
    return newTicket;
  },

  async updateTicketStatus(id, newStatus) {
    const ticket = db.tickets.find(t => t.id === id);
    if (!ticket) throw new Error('Chamado não encontrado.');
    ticket.status = newStatus;
    saveData(db);
    return ticket;
  },

  async deleteTicket(id) {
    db.tickets = db.tickets.filter(t => t.id !== id);
    saveData(db);
    return true;
  }
};

