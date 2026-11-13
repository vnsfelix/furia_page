import { randomUUID } from 'node:crypto';
import { formatUser, formatTicket } from '../../backend/src/db/repository.js';
import { HttpError } from '../../backend/src/services/validation.js';

// Test double only: production never imports this repository.
export function memoryRepository() {
  let protocol = 10000;
  const users = new Map(); const tickets = new Map(); const sessions = new Map(); const limits = new Map();
  return {
    users, tickets, sessions,
    async health() {},
    async rateLimit(key, max) { const n = (limits.get(key) || 0) + 1; limits.set(key, n); return n <= max; },
    async findUsers() { return [...users.values()].map(formatUser); },
    async findUserById(id) { return formatUser(users.get(id)); },
    async findUserByEmail(email) { return [...users.values()].find(u => u.email === email) || null; },
    async createUser(data) { if ([...users.values()].some(u => u.email === data.email)) throw new HttpError(409, 'E-mail duplicado.'); const row = { ...data, id: `usr_${randomUUID()}`, created_at: new Date().toISOString() }; users.set(row.id, row); return formatUser(row); },
    async updateUser(id, patch) { if (!users.has(id)) throw new HttpError(404, 'Usuário não encontrado.'); Object.assign(users.get(id), patch); return formatUser(users.get(id)); },
    async updatePassword(id, senha) { users.get(id).senha = senha; },
    async changePassword(id, expected, senha) { if (users.get(id).senha !== expected) return false; users.get(id).senha = senha; await this.revokeSessions(id); return true; },
    async deleteUser(id) { if (!users.delete(id)) throw new HttpError(404, 'Usuário não encontrado.'); },
    async createSession(row) { sessions.set(row.token_hash, row); },
    async findSession(hash) { const row = sessions.get(hash); return row && Date.parse(row.expires_at) > Date.now() ? row : null; },
    async deleteSession(hash) { sessions.delete(hash); },
    async revokeSessions(userId) { for (const [hash,row] of sessions) if (row.user_id === userId) sessions.delete(hash); },
    async findTickets({ userId, status } = {}) { return [...tickets.values()].filter(t => (!userId || t.user_id === userId) && (!status || t.status === status)).map(formatTicket); },
    async findTicketById(id) { return formatTicket(tickets.get(id)); },
    async createTicket(data, user) { const row = { ...data, id: `TK-${protocol++}`, user_id: user.id, user_name: user.nome, user_email: user.email, status: 'Recebido', created_at: new Date().toISOString() }; tickets.set(row.id, row); return formatTicket(row); },
    async updateTicket(id, patch) { if (!tickets.has(id)) throw new HttpError(404, 'Chamado não encontrado.'); Object.assign(tickets.get(id), patch); return formatTicket(tickets.get(id)); },
    async deleteTicket(id) { if (!tickets.delete(id)) throw new HttpError(404, 'Chamado não encontrado.'); },
    async getTelegramLink() { return null; }
  };
}
