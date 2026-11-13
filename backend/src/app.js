import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { comparePassword, hashPassword, randomToken, tokenHash } from './services/passwords.js';
import { HttpError, text, choice, roles, statuses, userInput, ticketInput } from './services/validation.js';
import { formatUser } from './db/repository.js';
import { ticketSummary, attachmentBytes } from './services/attachments.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const cookieName = 'furia_session';
function sessionToken(req) {
  const value = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(value || '') ? value : null;
}
export function equalSecret(actual, expected) {
  return typeof actual === 'string' && Boolean(expected) && Buffer.byteLength(actual) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
export function createApp({ repository, config, telegram } = {}) {
  const app = express();
  app.disable('x-powered-by');
  const cookieOptions = { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/' };
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    res.set('X-Frame-Options', 'DENY');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    const origin = req.get('origin');
    const ownOrigin = config.origin || (!config.production ? `http://${req.get('host')}` : '');
    const devOrigin = !config.production && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    const allowed = origin && (origin === ownOrigin || devOrigin);
    if (allowed) { res.set('Access-Control-Allow-Origin', origin); res.set('Access-Control-Allow-Credentials', 'true'); res.vary('Origin'); }
    const externalEndpoint = req.path === '/api/telegram/webhook' || req.path === '/api/internal/telegram-delivery';
    if (!externalEndpoint && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (!allowed || req.get('sec-fetch-site') === 'cross-site')) return res.status(403).json({ error: 'Origem da requisição não autorizada.' });
    if (req.method === 'OPTIONS') {
      if (!allowed) return res.sendStatus(403);
      res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type'); return res.sendStatus(204);
    }
    next();
  });
  app.use(express.json({ limit: '4mb' }));
  app.get('/api/health', (req, res) => res.json({ status: 'online', timestamp: new Date().toISOString() }));
  app.use('/api', (req, res, next) => repository ? next() : res.status(503).json({ error: 'Configure uma credencial secreta Supabase no servidor. SQLite não é utilizado em produção.' }));
  app.get('/api/ready', wrap(async (req, res) => { await repository.health(); res.json({ status: 'ready', banco: 'Supabase PostgreSQL' }); }));
  async function limit(req, suffix, max = 10) {
    const key = tokenHash(`${req.ip}:${suffix}`);
    if (!await repository.rateLimit(key, max, 900)) throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos.');
  }
  async function startSession(req, res, user, remember = false) {
    const previous = sessionToken(req);
    if (previous) await repository.deleteSession(tokenHash(previous));
    const token = randomToken(); const duration = (remember ? 30 : 1) * 86400000;
    await repository.createSession({ token_hash: tokenHash(token), user_id: user.id, expires_at: new Date(Date.now() + duration).toISOString() });
    res.cookie(cookieName, token, { ...cookieOptions, ...(remember ? { maxAge: duration } : {}) });
  }
  app.post('/api/auth/login', wrap(async (req, res) => {
    const email = text(req.body.email, 'E-mail', 100).toLowerCase();
    await limit(req, `login:${email}`);
    const password = req.body.password;
    if (typeof password !== 'string' || password.length > 128 || !password) throw new HttpError(400, 'Senha inválida.');
    const user = await repository.findUserByEmail(email);
    // Always perform a password derivation, including when the user does not exist.
    const dummy = 'scrypt$00000000000000000000000000000000$' + '00'.repeat(64);
    const valid = await comparePassword(password, user?.senha || dummy);
    if (user && !user.senha?.startsWith('scrypt$')) await comparePassword(password, dummy);
    if (!user || !valid) throw new HttpError(401, 'E-mail ou senha incorretos.');
    if (!user.senha.startsWith('scrypt$')) await repository.updatePassword(user.id, await hashPassword(password));
    await startSession(req, res, user, req.body.remember === true);
    res.json({ message: 'Login realizado com sucesso!', user: formatUser(user) });
  }));
  app.post('/api/auth/register', wrap(async (req, res) => {
    await limit(req, 'register', 50);
    const { password, ...data } = userInput(req.body);
    const user = await repository.createUser({ ...data, senha: await hashPassword(password) });
    await startSession(req, res, user);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user });
  }));
  app.post('/api/auth/logout', wrap(async (req, res) => {
    const token = sessionToken(req);
    if (token) await repository.deleteSession(tokenHash(token));
    res.clearCookie(cookieName, cookieOptions); res.sendStatus(204);
  }));
  app.post('/api/telegram/webhook', wrap(async (req, res) => {
    if (!telegram || !config.telegramToken || !config.telegramSecret || !config.telegramUsername) throw new HttpError(503, 'Integração Telegram não configurada.');
    if (!equalSecret(req.get('X-Telegram-Bot-Api-Secret-Token'), config.telegramSecret)) throw new HttpError(403, 'Webhook não autorizado.');
    await telegram.process(req.body); res.json({ ok: true });
  }));
  app.get('/api/internal/telegram-delivery', wrap(async (req, res) => {
    if (!telegram || !equalSecret(req.get('authorization'), `Bearer ${config.cronSecret}`) || !config.cronSecret) throw new HttpError(403, 'Acesso não autorizado.');
    res.json({ delivered: await telegram.deliver() });
  }));
  app.use('/api', wrap(async (req, res, next) => {
    const token = sessionToken(req);
    const session = token && await repository.findSession(tokenHash(token));
    const user = session && await repository.findUserById(session.user_id);
    if (!user) throw new HttpError(401, 'Faça login para continuar.');
    req.user = user; next();
  }));
  const allow = (...permitted) => (req, res, next) => permitted.includes(req.user.role) ? next() : next(new HttpError(403, 'Você não tem permissão para esta operação.'));
  function ownUser(req) { if (req.user.role !== 'admin' && req.user.id !== req.params.id) throw new HttpError(403, 'Acesso não autorizado.'); }
  async function ticketFor(req) {
    const ticket = await repository.findTicketById(req.params.id);
    if (!ticket) throw new HttpError(404, 'Chamado não encontrado.');
    if (!['admin', 'tecnico'].includes(req.user.role) && ticket.user_id !== req.user.id) throw new HttpError(403, 'Acesso não autorizado.');
    return ticket;
  }
  app.get('/api/auth/me', (req, res) => res.json({ user: req.user }));
  app.post('/api/auth/password', wrap(async (req, res) => {
    await limit(req, `password:${req.user.id}`, 5);
    const current = await repository.findUserByEmail(req.user.email);
    if (!await comparePassword(req.body.currentPassword, current?.senha)) throw new HttpError(401, 'Senha atual incorreta.');
    const password = req.body.newPassword;
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new HttpError(400, 'A nova senha deve ter entre 8 e 128 caracteres.');
    if (!await repository.changePassword(req.user.id, current.senha, await hashPassword(password))) throw new HttpError(409, 'A senha foi alterada em outra sessão. Tente novamente.');
    await startSession(req, res, req.user, req.body.remember === true);
    res.json({ message: 'Senha atualizada. As sessões anteriores foram encerradas.' });
  }));
  app.get('/api/tickets', wrap(async (req, res) => {
    const status = req.query.status ? choice(req.query.status, statuses, 'Status') : undefined;
    res.json((await repository.findTickets({ status, userId: ['admin', 'tecnico'].includes(req.user.role) ? undefined : req.user.id })).map(ticketSummary));
  }));
  app.get('/api/tickets/user/:userId', wrap(async (req, res) => {
    if (!['admin', 'tecnico'].includes(req.user.role) && req.user.id !== req.params.userId) throw new HttpError(403, 'Acesso não autorizado.');
    res.json((await repository.findTickets({ userId: req.params.userId })).map(ticketSummary));
  }));
  app.get('/api/tickets/:id/attachment', wrap(async (req, res) => {
    const ticket = await ticketFor(req); const attachment = attachmentBytes(ticket.anexo);
    res.set('Content-Type', attachment.type);
    res.set('Content-Disposition', `${attachment.type === 'application/pdf' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`);
    res.send(attachment.bytes);
  }));
  app.get('/api/tickets/:id', wrap(async (req, res) => res.json(await ticketFor(req))));
  app.post('/api/tickets', wrap(async (req, res) => {
    await limit(req, `ticket:${req.user.id}`, 60);
    const ticket = await repository.createTicket(ticketInput(req.body), req.user);
    res.status(201).json({ message: 'Chamado gravado com sucesso!', ticket });
  }));
  app.put('/api/tickets/:id/status', allow('admin', 'tecnico'), wrap(async (req, res) => {
    const status = choice(req.body.status, statuses, 'Status');
    res.json({ message: 'Status atualizado!', ticket: await repository.updateTicket(req.params.id, { status }) });
  }));
  app.put('/api/tickets/:id', allow('admin', 'tecnico'), wrap(async (req, res) => res.json({ message: 'Chamado atualizado!', ticket: await repository.updateTicket(req.params.id, ticketInput(req.body, true)) })));
  app.delete('/api/tickets/:id', allow('admin'), wrap(async (req, res) => { await repository.deleteTicket(req.params.id); res.json({ message: 'Chamado excluído.' }); }));
  for (const [route, role] of [['users', null], ['tecnicos', 'tecnico'], ['clientes', 'funcionario']]) {
    app.get(`/api/${route}`, allow('admin'), wrap(async (req, res) => { const filter = role || req.query.role; res.json((await repository.findUsers()).filter(u => !filter || u.role === filter)); }));
  }
  app.get('/api/users/:id', wrap(async (req, res) => { ownUser(req); const user = await repository.findUserById(req.params.id); if (!user) throw new HttpError(404, 'Usuário não encontrado.'); res.json(user); }));
  app.post('/api/users', allow('admin'), wrap(async (req, res) => {
    const { password, ...data } = userInput(req.body, true);
    res.status(201).json({ message: 'Colaborador cadastrado!', user: await repository.createUser({ ...data, senha: await hashPassword(password) }) });
  }));
  app.put('/api/users/:id', wrap(async (req, res) => {
    ownUser(req); const patch = {};
    if (req.body.role !== undefined) { if (req.user.role !== 'admin') throw new HttpError(403, 'Somente administradores alteram perfis.'); if (req.params.id === req.user.id && req.body.role !== 'admin') throw new HttpError(400, 'Você não pode remover seu próprio acesso administrativo.'); patch.role = choice(req.body.role, roles, 'Perfil'); }
    if (req.body.name !== undefined || req.body.nome !== undefined) patch.nome = text(req.body.name ?? req.body.nome, 'Nome', 100);
    if (req.body.department !== undefined) patch.department = text(req.body.department, 'Setor', 50);
    res.json({ message: 'Colaborador atualizado!', user: await repository.updateUser(req.params.id, patch) });
  }));
  app.delete('/api/users/:id', allow('admin'), wrap(async (req, res) => { if (req.params.id === req.user.id) throw new HttpError(400, 'Você não pode excluir sua própria conta.'); await repository.deleteUser(req.params.id); res.json({ message: 'Usuário removido.' }); }));
  app.get('/api/telegram/link', wrap(async (req, res) => {
    const available = Boolean(config.telegramUsername && config.telegramToken && config.telegramSecret);
    res.json({ linked: available && Boolean(await repository.getTelegramLink(req.user.id, config.telegramUsername.toLowerCase())), available });
  }));
  app.post('/api/telegram/link', wrap(async (req, res) => {
    if (!config.telegramUsername || !config.telegramToken || !config.telegramSecret) throw new HttpError(503, 'Bot ainda não configurado.');
    await limit(req, `link:${req.user.id}`, 10);
    const token = randomToken(); await repository.createTelegramLink({ token_hash: tokenHash(token), bot_key: config.telegramUsername.toLowerCase(), user_id: req.user.id, expires_at: new Date(Date.now() + 600000).toISOString() });
    res.json({ url: `https://t.me/${config.telegramUsername}?start=${token}`, expiresIn: 600 });
  }));
  app.delete('/api/telegram/link', wrap(async (req, res) => { await repository.unlinkTelegram(req.user.id); res.json({ linked: false }); }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  app.use('/assets', express.static(path.join(root, 'assets'), { dotfiles: 'deny', index: false }));
  app.get(['/', '/index.html', '/cadastro.html'], (req, res) => res.sendFile(path.join(root, req.path === '/cadastro.html' ? 'cadastro.html' : 'index.html')));
  app.get(/^\/(admin|chamados|conta|enviados|errado|inicial|presencial|problemas|tecnico)(\/|\/index\.html)?$/, (req, res) => res.sendFile(path.join(root, req.params[0], 'index.html')));
  app.use((req, res) => res.sendStatus(404));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : err.status || 500;
    const message = err instanceof HttpError ? err.message : status === 413 ? 'Arquivo ou requisição muito grande.' : status === 400 ? 'JSON inválido.' : 'Não foi possível concluir a operação.';
    res.status(status).json({ error: message });
  });
  return app;
}
