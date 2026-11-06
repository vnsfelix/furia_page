/**
 * ==============================================================================
 * FURIA Helpdesk - Banco de Dados Híbrido (Supabase Cloud + SQLite3 Local)
 * ==============================================================================
 * 1. Nuvem (Supabase): Quando SUPABASE_URL e SUPABASE_KEY estiverem configurados,
 *    os dados ficam persistidos 24h na nuvem (ideal para Vercel e produção).
 * 2. Local (SQLite3): Caso as chaves do Supabase não estejam preenchidas, o sistema
 *    utiliza automaticamente o SQLite local em backend/database.sqlite.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

// Carrega variáveis do arquivo .env da raiz, se existir
const envPath = path.resolve(rootDir, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        const key = k.trim();
        if (!process.env[key]) {
          process.env[key] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      }
    }
  } catch {}
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isUsingSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

let supabase = null;
let db = null;

if (isUsingSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log(`> Conectado ao banco de dados Supabase na nuvem: ${SUPABASE_URL}`);
} else {
  // Inicialização do SQLite local como fallback
  const { DatabaseSync } = await import('node:sqlite');
  let DB_PATH = path.resolve(__dirname, '../../database.sqlite');

  if (process.env.VERCEL) {
    const tmpDbPath = path.join(os.tmpdir(), 'furia_database.sqlite');
    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, tmpDbPath);
      }
      DB_PATH = tmpDbPath;
    } catch (err) {
      console.warn('Aviso Vercel SQLite:', err.message);
    }
  }

  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON;');

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
      anexo TEXT,
      status VARCHAR(30) DEFAULT 'Recebido',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed Admin no SQLite
  const checkAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@furia.gg');
  if (!checkAdmin) {
    db.prepare(`
      INSERT INTO users (id, nome, email, senha, role, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'usr_admin',
      'Administrador FURIA',
      'admin@furia.gg',
      hashPassword('VAG2026@'),
      'admin',
      'Tecnologia & Operações'
    );
    console.log('> Administrador padrão criado: admin@furia.gg (senha: VAG2026@)');
  }

  // Seed Técnico no SQLite
  const checkTecnico = db.prepare('SELECT id FROM users WHERE email = ?').get('tecnico@furia.gg');
  if (!checkTecnico) {
    db.prepare(`
      INSERT INTO users (id, nome, email, senha, role, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'usr_tecnico',
      'Técnico Suporte FURIA',
      'tecnico@furia.gg',
      hashPassword('TecFuria2026@'),
      'tecnico',
      'Suporte Técnico & TI'
    );
    console.log('> Técnico padrão criado: tecnico@furia.gg (senha: TecFuria2026@)');
  }
}

export { db };

// Hash seguro SHA-256
export function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password).trim()).digest('hex');
}

// Comparação com tempo constante
export function comparePassword(inputPassword, storedValue) {
  const cleanInput = String(inputPassword).trim();
  const cleanStored = String(storedValue).trim();
  const inputHash = hashPassword(cleanInput);

  if (cleanStored.length === 64 && /^[0-9a-f]+$/i.test(cleanStored)) {
    try {
      return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(cleanStored, 'hex'));
    } catch {
      return false;
    }
  }
  return cleanInput === cleanStored;
}

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
  // --- USUÁRIOS ---
  async findUsers() {
    if (isUsingSupabase) {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(formatUser);
    }
    const rows = db.prepare('SELECT id, nome, email, role, department, created_at FROM users ORDER BY created_at DESC').all();
    return rows.map(formatUser);
  },

  async findUserById(id) {
    if (isUsingSupabase) {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return formatUser(data);
    }
    const row = db.prepare('SELECT id, nome, email, role, department, created_at FROM users WHERE id = ?').get(id);
    return formatUser(row);
  },

  async findUserByEmail(email) {
    const clean = String(email).trim().toLowerCase();
    if (isUsingSupabase) {
      const { data, error } = await supabase.from('users').select('*').ilike('email', clean).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return {
        ...formatUser(data),
        senha: data.senha,
        password: data.senha
      };
    }
    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(clean);
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

    if (isUsingSupabase) {
      const { data, error } = await supabase.from('users').insert({
        id,
        nome: finalName,
        email: cleanEmail,
        senha: finalPass,
        role,
        department
      }).select().single();

      if (error) {
        if (error.code === '23505' || String(error.message).includes('unique')) {
          throw new Error('Este e-mail já está cadastrado no sistema.');
        }
        throw new Error(error.message);
      }
      return formatUser(data);
    }

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

    if (isUsingSupabase) {
      const { data, error } = await supabase.from('users').update({
        nome: newName,
        department: newDept,
        role: newRole
      }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return formatUser(data);
    }

    db.prepare(`
      UPDATE users SET nome = ?, department = ?, role = ? WHERE id = ?
    `).run(newName, newDept, newRole, id);

    return this.findUserById(id);
  },

  async deleteUser(id) {
    if (isUsingSupabase) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (res.changes === 0) throw new Error('Usuário não encontrado.');
    return true;
  },

  // --- TICKETS / CHAMADOS ---
  async findTickets(filter = {}) {
    if (isUsingSupabase) {
      let query = supabase.from('tickets').select('*');
      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }
      if (filter.status) {
        query = query.ilike('status', filter.status);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map(formatTicket);
    }

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
    if (isUsingSupabase) {
      const { data, error } = await supabase.from('tickets').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return formatTicket(data);
    }
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
    const anexo = data.anexo ? (typeof data.anexo === 'object' ? JSON.stringify(data.anexo) : String(data.anexo)) : null;
    const status = 'Recebido';

    if (isUsingSupabase) {
      const { data: created, error } = await supabase.from('tickets').insert({
        id,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        tipo,
        titulo,
        categoria,
        local,
        tiposervico,
        descricao,
        urgencia,
        anexo,
        status
      }).select().single();
      if (error) throw new Error(error.message);
      return formatTicket(created);
    }

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
    if (isUsingSupabase) {
      const { data, error } = await supabase.from('tickets').update({ status }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('Chamado não encontrado.');
      return formatTicket(data);
    }
    const res = db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(status, id);
    if (res.changes === 0) throw new Error('Chamado não encontrado.');
    return this.findTicketById(id);
  },

  async updateTicket(id, updates) {
    if (isUsingSupabase) {
      const current = await this.findTicketById(id);
      if (!current) throw new Error('Chamado não encontrado.');

      const patch = {};
      if (updates.titulo) patch.titulo = updates.titulo;
      if (updates.descricao) patch.descricao = updates.descricao;
      if (updates.urgencia) patch.urgencia = updates.urgencia;
      if (updates.status) patch.status = updates.status;
      if (updates.categoria) patch.categoria = updates.categoria;
      if (updates.local) patch.local = updates.local;
      if (updates.tiposervico) patch.tiposervico = updates.tiposervico;

      const { data, error } = await supabase.from('tickets').update(patch).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return formatTicket(data);
    }

    const current = await this.findTicketById(id);
    if (!current) throw new Error('Chamado não encontrado.');

    const titulo = updates.titulo || current.titulo;
    const descricao = updates.descricao || current.descricao;
    const urgencia = updates.urgencia || current.urgencia;
    const status = updates.status || current.status;
    const categoria = updates.categoria || current.categoria;
    const local = updates.local || current.local;
    const tiposervico = updates.tiposervico || current.tiposervico;

    db.prepare(`
      UPDATE tickets
      SET titulo = ?, descricao = ?, urgencia = ?, status = ?, categoria = ?, local = ?, tiposervico = ?
      WHERE id = ?
    `).run(titulo, descricao, urgencia, status, categoria, local, tiposervico, id);

    return this.findTicketById(id);
  },

  async deleteTicket(id) {
    if (isUsingSupabase) {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const res = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
    if (res.changes === 0) throw new Error('Chamado não encontrado.');
    return true;
  }
};
