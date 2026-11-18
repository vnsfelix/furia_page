import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextConversation, emptyState } from '../backend/src/telegram/conversation.js';
import { createTelegram } from '../backend/src/telegram/service.js';
import { tokenHash } from '../backend/src/services/passwords.js';
const config = { telegramToken: 'test-token', telegramUsername: 'TestBot' };
function flow(messages) {
  let state = emptyState(); let response;
  for (const message of messages) { response = nextConversation(state, message); state = JSON.parse(JSON.stringify(response.next)); }
  return response;
}
test('guided technical ticket preserves category, title, description and urgency', () => {
  const r = flow(['/chamado', 'problemas', 'sistema', 'Falha no software', 'Não abre o aplicativo', 'alta', 'confirmar']);
  assert.deepEqual(r.ticket, { tipo: 'problemas', categoria: 'sistema', titulo: 'Falha no software', descricao: 'Não abre o aplicativo', urgencia: 'alta' });
  assert.equal(r.next.stage, 'idle');
});
test('guided in-person ticket and serialized drafts survive another function instance', () => {
  const r = flow(['/chamado', 'presencial', 'estudio', 'redes', 'Rede indisponível', 'Sem conexão na arena', 'media', 'confirmar']);
  assert.equal(r.ticket.tipo, 'presencial'); assert.equal(r.ticket.local, 'estudio'); assert.equal(r.ticket.tiposervico, 'redes');
});
test('invalid choices keep the stage and cancellation clears the draft', () => {
  let r = flow(['/chamado', 'unknown']); assert.equal(r.next.stage, 'tipo'); assert.equal(r.ticket, null);
  r = flow(['/chamado', 'problemas', 'sistema', 'a'.repeat(151)]); assert.equal(r.next.stage, 'titulo');
  r = flow(['/chamado', 'problemas', 'sistema', 'Title', 'Description', 'alta', 'no']); assert.equal(r.next.stage, 'confirmar'); assert.equal(r.ticket, null);
  r = flow(['/chamado', 'problemas', '/cancelar']); assert.deepEqual(r.next, emptyState());
});
test('private messages only; malformed update identifiers are refused', async () => {
  let calls = 0; const bot = createTelegram({ config, repository: { rpc() { calls++; } } });
  await bot.process({ update_id: 1, message: { chat: { type: 'group' } } });
  await bot.process({ update_id: 2, edited_message: {} }); assert.equal(calls, 0);
  await assert.rejects(bot.process({ update_id: '1' }), e => e.status === 400);
  await assert.rejects(bot.process({ update_id: 3, message: { chat: { type: 'private', id: 1 }, from: { id: 2 }, message_id: 1 } }), e => e.status === 400);
});
function message(text, update_id = 1) { return { update_id, message: { chat: { type: 'private', id: 123 }, from: { id: 123 }, message_id: update_id, text } }; }
test('link tokens reach PostgreSQL only as a hash; bot namespace is explicit', async () => {
  const events = []; const repository = { async getTelegramState(chat, bot) { assert.equal(bot, 'testbot'); return null; }, async rpc(name, args) { if (name === 'helpdesk_process_telegram') events.push(args.p_event); return name === 'helpdesk_process_telegram' ? 'processed' : []; } };
  const bot = createTelegram({ config, repository }); const token = 'a'.repeat(43);
  await bot.process(message('/start ' + token)); assert.equal(events[0].linkHash, tokenHash(token)); assert.ok(!JSON.stringify(events[0]).includes(token)); assert.equal(events[0].bot, 'testbot');
});
test('concurrent state changes are reread and retried before acknowledging', async () => {
  let reads = 0, commits = 0;
  const bot = createTelegram({ config, repository: { async getTelegramState() { reads++; return null; }, async rpc(name) { if (name === 'helpdesk_process_telegram') return ++commits < 3 ? 'retry' : 'processed'; return []; } } });
  await bot.process(message('/chamado')); assert.equal(reads, 3); assert.equal(commits, 3);
});
test('expired draft starts over instead of creating an obsolete ticket', async () => {
  let event;
  const bot = createTelegram({ config, repository: { async getTelegramState() { return { version: 4, expires_at: '2000-01-01', state: { stage: 'confirmar', draft: {} } }; }, async rpc(name, args) { if (name === 'helpdesk_process_telegram') { event = args.p_event; return 'processed'; } return []; } } });
  await bot.process(message('confirmar')); assert.equal(event.ticket, null); assert.equal(event.next.stage, 'idle'); assert.equal(event.expectedVersion, 4);
});
test('ticket creation is delegated to one transactional RPC with preserved author lookup', async () => {
  let event;
  const draft = { tipo: 'problemas', categoria: 'sistema', titulo: 'Title', descricao: 'Description', urgencia: 'media' };
  const bot = createTelegram({ config, repository: { async getTelegramState() { return { version: 6, expires_at: '2099-01-01', state: { stage: 'confirmar', draft } }; }, async rpc(name, args) { if (name === 'helpdesk_process_telegram') { event = args.p_event; return 'processed'; } return []; } } });
  await bot.process(message('confirmar')); assert.equal(event.ticket.id, undefined); assert.equal(event.ticket.user_id, undefined); assert.equal(event.next.stage, 'idle');
});
test('Telegram delivery failure is persisted for retry and does not fail a committed update', async () => {
  const finishes = []; let created = 0;
  const repository = {
    async getTelegramState() { return null; }, async rpc(name, args) {
      if (name === 'helpdesk_process_telegram') { created++; return 'processed'; }
      if (name === 'helpdesk_claim_telegram_outbox') { assert.equal(args.p_bot, 'testbot'); return [{ id: 1, chat_id: 123, reply: 'Received', lease_token: 'lease' }]; }
      if (name === 'helpdesk_finish_telegram_outbox') { finishes.push(args); return null; }
    }
  };
  const bot = createTelegram({ config, repository, fetchImpl: async () => { throw new Error('offline'); } });
  await bot.process(message('/chamado')); assert.equal(created, 1); assert.equal(finishes[0].p_success, false);
  const recovered = createTelegram({ config, repository, fetchImpl: async () => new Response('{"ok":true}') });
  assert.equal(await recovered.deliver(), 1); assert.equal(created, 1); assert.equal(finishes[1].p_success, true);
});
