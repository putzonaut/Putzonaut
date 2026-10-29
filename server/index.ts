import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { database, migrate } from './database.ts';
import { createApp } from './app.ts';

const production = process.env.NODE_ENV === 'production';
if (production && (!process.env.DATABASE_URL || !process.env.APP_ORIGIN || !process.env.SETUP_TOKEN)) {
  throw new Error('DATABASE_URL, APP_ORIGIN und SETUP_TOKEN müssen für den Produktionsbetrieb gesetzt sein.');
}
if (process.env.APP_ORIGIN) {
  const origin = new URL(process.env.APP_ORIGIN);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== process.env.APP_ORIGIN) throw new Error('APP_ORIGIN muss eine HTTP(S)-Origin ohne abschließenden Schrägstrich sein.');
}
await mkdir('.local', { recursive: true });
const db = await database(process.env.DATABASE_URL, process.env.PGDATA || path.resolve('.local/postgres'));
await migrate(db);
const app = createApp(db, { production, origin: process.env.APP_ORIGIN, setupToken: process.env.SETUP_TOKEN || 'putzonaut-dev', staticDir: production ? path.resolve('dist') : undefined, trustProxy: process.env.TRUST_PROXY === '1' });
const server = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Putzonaut ${production ? 'production' : 'development'} ready`));
async function shutdown() { server.closeAllConnections(); server.close(); await db.close(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
