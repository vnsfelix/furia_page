import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { HttpError } from '../services/validation.js';
const publicUserColumns = 'id,nome,email,role,department,created_at';
export function formatUser(row) {
  if (!row) return null;
  const { senha, password, ...safe } = row;
  return { ...safe, name: row.nome, createdAt: row.created_at };
}
export const formatTicket = row => row && ({ ...row, userId: row.user_id, userName: row.user_name, userEmail: row.user_email, data: row.created_at });
function check(error) {
  if (!error) return;
  if (error.code === '23505') throw new HttpError(409, 'Registro já cadastrado. Confira o e-mail ou identificador.');
  if (error.code === '23503') throw new HttpError(400, 'Registro relacionado inválido.');
  throw new HttpError(503, 'Banco de dados indisponível. Tente novamente.');
}
export function createRepository(client) {
  async function one(query) { const { data, error } = await query; check(error); return data; }
  async function all(table, columns, filters = {}) {
    const rows = [];
    for (let offset = 0; ; offset += 100) {
      let query = client.from(table).select(columns).order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 99);
      for (const [key, value] of Object.entries(filters)) if (value) query = query.eq(key, value);
      const page = await one(query); rows.push(...page);
      if (page.length < 100) return rows;
    }
  }
  return {
    async health() { await one(client.from('users').select('id').limit(1)); await one(client.from('sessions').select('token_hash').limit(1)); },
    async findUsers() { return (await all('users', publicUserColumns)).map(formatUser); },
    async findUserById(id) { return formatUser(await one(client.from('users').select(publicUserColumns).eq('id', id).maybeSingle())); },
    async findUserByEmail(email) { return one(client.from('users').select('*').eq('email', email.trim().toLowerCase()).maybeSingle()); },
    async createUser(user) { return formatUser(await one(client.from('users').insert({ ...user, id: `usr_${randomUUID()}` }).select(publicUserColumns).single())); },
    async updateUser(id, patch) { const row = await one(client.from('users').update(patch).eq('id', id).select(publicUserColumns).maybeSingle()); if (!row) throw new HttpError(404, 'Usuário não encontrado.'); return formatUser(row); },
    async updatePassword(id, senha) { await one(client.from('users').update({ senha }).eq('id', id)); },
    async changePassword(userId, currentHash, newHash) { return one(client.rpc('helpdesk_change_password', { p_user_id: userId, p_current_hash: currentHash, p_new_hash: newHash })); },
    async deleteUser(id) { const rows = await one(client.from('users').delete().eq('id', id).select('id')); if (!rows.length) throw new HttpError(404, 'Usuário não encontrado.'); },
    async findTickets({ userId, status } = {}) { return (await all('tickets', '*', { user_id: userId, status })).map(formatTicket); },
    async findTicketById(id) { return formatTicket(await one(client.from('tickets').select('*').eq('id', id).maybeSingle())); },
    async createTicket(ticket, user) { return formatTicket(await one(client.from('tickets').insert({ ...ticket, user_id: user.id, user_name: user.nome || user.name, user_email: user.email, status: 'Recebido' }).select().single())); },
    async updateTicket(id, patch) { const row = await one(client.from('tickets').update(patch).eq('id', id).select().maybeSingle()); if (!row) throw new HttpError(404, 'Chamado não encontrado.'); return formatTicket(row); },
    async deleteTicket(id) { const rows = await one(client.from('tickets').delete().eq('id', id).select('id')); if (!rows.length) throw new HttpError(404, 'Chamado não encontrado.'); },
    async createSession(session) { await one(client.from('sessions').insert(session)); },
    async findSession(hash) { return one(client.from('sessions').select('user_id,expires_at').eq('token_hash', hash).gt('expires_at', new Date().toISOString()).maybeSingle()); },
    async deleteSession(hash) { await one(client.from('sessions').delete().eq('token_hash', hash)); },
    async revokeSessions(userId) { await one(client.from('sessions').delete().eq('user_id', userId)); },
    async rateLimit(key, limit, seconds) { return one(client.rpc('helpdesk_rate_limit', { p_key: key, p_limit: limit, p_seconds: seconds })); },
    async rpc(name, args) { return one(client.rpc(name, args)); },
    async createTelegramLink(row) { await one(client.from('telegram_link_tokens').insert(row)); },
    async getTelegramState(chatId, bot) { return one(client.from('telegram_sessions').select('*').eq('chat_id', chatId).eq('bot_key', bot).maybeSingle()); },
    async getTelegramLink(userId, bot) { return one(client.from('telegram_links').select('telegram_user_id,created_at').eq('user_id', userId).eq('bot_key', bot).maybeSingle()); },
    async unlinkTelegram(userId) { await one(client.rpc('helpdesk_unlink_telegram', { p_user_id: userId })); }
  };
}
export function configuredRepository(config) {
  if (!config.databaseReady) return null;
  return createRepository(createClient(config.supabaseUrl, config.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(10000) }) } }));
}
