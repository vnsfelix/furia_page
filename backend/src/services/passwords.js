import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}
export async function comparePassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string' || password.length > 1024) return false;
  if (/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored)) {
    const [, salt, expected] = stored.split('$');
    return timingSafeEqual(await scrypt(password, salt, 64), Buffer.from(expected, 'hex'));
  }
  if (/^[a-f0-9]{64}$/i.test(stored)) return timingSafeEqual(createHash('sha256').update(password.trim()).digest(), Buffer.from(stored, 'hex'));
  return false;
}
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');
