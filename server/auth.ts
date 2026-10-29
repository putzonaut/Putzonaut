import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Database } from './database.ts';
import { AppError } from './domain.ts';

const params = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, params, (error, key) => error ? reject(error) : resolve(key));
});
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, expected] = encoded.split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const actual = await derive(password, salt);
  const reference = Buffer.from(expected, 'hex');
  return actual.length === reference.length && timingSafeEqual(actual, reference);
}
export function cookieToken(req: Request) {
  const match = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('putzonaut_session='));
  const value = match?.slice('putzonaut_session='.length);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export async function requireUser(db: Database, req: Request) {
  const token = cookieToken(req);
  if (!token) throw new AppError(401, 'Bitte melde dich an.');
  const { rows } = await db.query(`SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id
    WHERE s.token_hash=$1 AND s.expires_at > now()`, [hashToken(token)]);
  if (!rows[0]) throw new AppError(401, 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
  return rows[0];
}
export async function createSession(db: Database, res: Response, userId: string, secure: boolean) {
  const token = randomBytes(32).toString('hex');
  await db.query(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,now() + interval '30 days')`, [hashToken(token), userId]);
  res.cookie('putzonaut_session', token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 });
}
