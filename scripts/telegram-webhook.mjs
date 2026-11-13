// Default is a local preview. --register performs an EXTERNAL WRITE and requires
// the project owner's prior authorization. Never called by builds or the server.
import { loadLocalEnv, readConfig } from '../backend/src/config/env.js';
loadLocalEnv();
const config = readConfig();
if (!config.origin.startsWith('https://') || !config.telegramToken || !config.telegramSecret || !config.telegramUsername) {
  throw new Error('Configure APP_URL HTTPS e as três variáveis TELEGRAM_* antes de preparar o webhook.');
}
if (!/^[A-Za-z0-9_-]{32,256}$/.test(config.telegramSecret)) throw new Error('TELEGRAM_WEBHOOK_SECRET precisa ter de 32 a 256 caracteres seguros.');
const payload = { url: `${config.origin}/api/telegram/webhook`, allowed_updates: ['message'], max_connections: 1, drop_pending_updates: false, secret_token: config.telegramSecret };
if (!process.argv.includes('--register')) {
  console.log(JSON.stringify({ mode: 'preview-local-sem-rede', ...payload, secret_token: '[REDACTED]' }, null, 2));
} else {
  let response;
  try { response = await fetch(`https://api.telegram.org/bot${config.telegramToken}/setWebhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) }); }
  catch { throw new Error('Não foi possível registrar o webhook. Verifique conectividade e configuração sem compartilhar o token.'); }
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`Telegram recusou o registro (HTTP ${response.status}).`);
  console.log('Webhook registrado no domínio configurado. Atualizações pendentes foram preservadas.');
}
