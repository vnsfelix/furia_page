import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
export function loadLocalEnv() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'test') return;
  const filename = fileURLToPath(new URL('../../../.env', import.meta.url));
  if (!fs.existsSync(filename)) return;
  for (const line of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
export function isServerKey(key = '') {
  if (key.startsWith('sb_secret_')) return true;
  try { return JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'service_role'; } catch { return false; }
}
export function readConfig(env = process.env) {
  const production = env.NODE_ENV === 'production' || Boolean(env.VERCEL);
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY || '';
  let databaseReady = false;
  try { databaseReady = new URL(env.SUPABASE_URL).protocol === 'https:' && isServerKey(key); } catch {}
  let origin = '';
  try { origin = new URL(env.APP_URL).origin; } catch {}
  const telegramReady = /^[A-Za-z0-9_-]{32,256}$/.test(env.TELEGRAM_WEBHOOK_SECRET || '')
    && /^[A-Za-z0-9_]{5,32}$/.test(env.TELEGRAM_BOT_USERNAME || '')
    && /^\d+:[A-Za-z0-9_-]{20,}$/.test(env.TELEGRAM_BOT_TOKEN || '');
  return { production, databaseReady, supabaseUrl: env.SUPABASE_URL, supabaseKey: key, origin,
    port: Number(env.PORT || 3000), telegramToken: telegramReady ? env.TELEGRAM_BOT_TOKEN : '',
    telegramSecret: telegramReady ? env.TELEGRAM_WEBHOOK_SECRET : '', telegramUsername: telegramReady ? env.TELEGRAM_BOT_USERNAME : '',
    cronSecret: (env.CRON_SECRET || '').length >= 32 ? env.CRON_SECRET : '' };
}
