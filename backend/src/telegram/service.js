import { tokenHash } from '../services/passwords.js';
import { nextConversation, emptyState } from './conversation.js';
import { HttpError } from '../services/validation.js';

export function createTelegram({ repository, config, fetchImpl = fetch }) {
  const bot = config.telegramUsername.toLowerCase();
  async function deliver(batch = 10) {
    const rows = await repository.rpc('helpdesk_claim_telegram_outbox', { p_limit: batch, p_bot: bot });
    let delivered = 0;
    for (const row of rows) {
      let success = false;
      try {
        const response = await fetchImpl(`https://api.telegram.org/bot${config.telegramToken}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: row.chat_id, text: row.reply, link_preview_options: { is_disabled: true } }),
          signal: AbortSignal.timeout(5000)
        });
        const body = await response.json(); success = response.ok && body.ok === true;
      } catch { /* Outbox retains failed messages. Never log a URL containing the bot token. */ }
      await repository.rpc('helpdesk_finish_telegram_outbox', { p_id: row.id, p_lease: row.lease_token, p_success: success });
      if (success) delivered++;
    }
    return delivered;
  }
  async function process(update) {
    if (!Number.isSafeInteger(update?.update_id) || update.update_id < 0) throw new HttpError(400, 'Atualização inválida.');
    const msg = update.message;
    if (!msg || msg.from?.is_bot || msg.chat?.type !== 'private') return;
    if (![msg.chat.id, msg.from?.id, msg.message_id].every(Number.isSafeInteger) || msg.chat.id !== msg.from.id || msg.chat.id <= 0 || msg.message_id <= 0) throw new HttpError(400, 'Mensagem inválida.');
    const input = typeof msg.text === 'string' ? msg.text : '';
    if (input.length > 4096) throw new HttpError(400, 'Mensagem muito longa.');
    const link = input.match(/^\/start\s+([A-Za-z0-9_-]{43})$/);
    for (let attempt = 0; attempt < 4; attempt++) {
      const stored = await repository.getTelegramState(String(msg.chat.id), bot);
      const expired = stored && Date.parse(stored.expires_at) <= Date.now();
      const state = !stored || expired ? emptyState() : stored.state;
      const result = link
        ? { next: emptyState(), reply: 'Conta vinculada! Use /chamado para abrir uma solicitação.' }
        : input ? nextConversation(state, input) : { next: state, reply: 'Nesta etapa, o bot recebe chamados por texto. Envie imagens ou PDFs pelo site.' };
      const ticket = result.ticket || null;
      // The database assigns the compact protocol and inserts it in the outbox reply.
      const reply = result.reply;
      const committed = await repository.rpc('helpdesk_process_telegram', { p_event: {
        bot, updateId: update.update_id, chatId: String(msg.chat.id), senderId: String(msg.from.id),
        messageId: msg.message_id, expectedVersion: stored?.version || 0,
        next: result.next, ticket, reply, linkHash: link ? tokenHash(link[1]) : null,
        rateKey: tokenHash(`telegram:${bot}:${msg.from.id}`)
      } });
      if (committed === 'retry') continue;
      // Commit first. A Telegram outage must not roll back or recreate the ticket.
      try { await deliver(1); } catch { /* Authenticated scheduler will retry delivery. */ }
      return;
    }
    throw new HttpError(503, 'Mensagem concorrente. Tente novamente.');
  }
  return { process, deliver };
}
