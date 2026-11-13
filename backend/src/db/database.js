// Compatibility entrypoint. Runtime persistence is Supabase-only; importing never opens SQLite.
export { createRepository, configuredRepository, formatUser, formatTicket } from './repository.js';
export { hashPassword, comparePassword } from '../services/passwords.js';
