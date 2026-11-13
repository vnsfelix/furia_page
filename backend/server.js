import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadLocalEnv, readConfig } from './src/config/env.js';
import { configuredRepository } from './src/db/repository.js';
import { createApp } from './src/app.js';
import { createTelegram } from './src/telegram/service.js';
loadLocalEnv();
const config = readConfig();
const repository = configuredRepository(config);
const telegram = repository && config.telegramToken && config.telegramSecret && config.telegramUsername
  ? createTelegram({ repository, config }) : null;
const app = createApp({ repository, config, telegram });
export default app;
if (!process.env.VERCEL && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  app.listen(config.port, () => {
    console.log(`FURIA Helpdesk: http://localhost:${config.port}`);
    if (!repository) console.warn('Configure SUPABASE_URL e SUPABASE_SECRET_KEY. Nenhum SQLite foi aberto.');
  });
}
