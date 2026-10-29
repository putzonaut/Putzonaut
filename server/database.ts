import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';

export interface Query {
  query(sql: string, values?: any[]): Promise<{ rows: any[] }>;
}
export interface Database extends Query {
  transaction<T>(fn: (client: Query) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export async function database(url?: string, localPath?: string): Promise<Database> {
  if (url) {
    const pool = new Pool({ connectionString: url, max: 10 });
    return {
      query: (sql, values) => pool.query(sql, values),
      async transaction(fn) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const value = await fn(client);
          await client.query('COMMIT');
          return value;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally { client.release(); }
      },
      close: () => pool.end(),
    };
  }
  const pg = new PGlite(localPath);
  await pg.waitReady;
  return {
    query: (sql, values) => pg.query(sql, values),
    transaction: fn => pg.transaction(client => fn(client)),
    close: () => pg.close(),
  };
}

// A single server migrates before accepting requests. Keep numbered migrations
// immutable once released; add new migrations for future versions.
export async function migrate(db: Database) {
  await db.transaction(async q => {
    await q.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY)`);
    const done = await q.query('SELECT version FROM schema_migrations WHERE version = 1');
    if (done.rows.length) return;
    for (const sql of [
      `CREATE TABLE households (
        id text PRIMARY KEY, name text NOT NULL, timezone text NOT NULL DEFAULT 'Europe/Berlin',
        goal_title text NOT NULL DEFAULT 'Gemeinsam zum Filmabend',
        week_goal integer NOT NULL DEFAULT 24 CHECK (week_goal BETWEEN 1 AND 500),
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE users (
        id text PRIMARY KEY, household_id text NOT NULL REFERENCES households(id),
        username text NOT NULL UNIQUE, name text NOT NULL, password_hash text NOT NULL,
        role text NOT NULL CHECK (role IN ('admin', 'member')),
        total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
        stars integer NOT NULL DEFAULT 0 CHECK (stars >= 0),
        outfit text NOT NULL DEFAULT 'starter', created_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE sessions (
        token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL
      )`,
      `CREATE TABLE invitations (
        token_hash text PRIMARY KEY, household_id text NOT NULL REFERENCES households(id),
        created_by text NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL,
        used_at timestamptz
      )`,
      `CREATE TABLE tasks (
        id text PRIMARY KEY, household_id text NOT NULL REFERENCES households(id),
        title text NOT NULL, room text NOT NULL, icon text NOT NULL, minutes integer NOT NULL CHECK (minutes BETWEEN 1 AND 180),
        xp integer NOT NULL CHECK (xp BETWEEN 1 AND 1000), stars integer NOT NULL CHECK (stars BETWEEN 0 AND 500),
        cadence text NOT NULL CHECK (cadence IN ('once', 'daily', 'weekly')),
        archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE completions (
        id text PRIMARY KEY, household_id text NOT NULL REFERENCES households(id),
        task_id text NOT NULL REFERENCES tasks(id), user_id text NOT NULL REFERENCES users(id),
        occurrence_key text NOT NULL, week_key text NOT NULL, xp integer NOT NULL, stars integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(task_id, occurrence_key)
      )`,
      `CREATE TABLE rewards (
        id text PRIMARY KEY, household_id text NOT NULL REFERENCES households(id), title text NOT NULL,
        cost integer NOT NULL CHECK (cost BETWEEN 1 AND 10000), icon text NOT NULL,
        archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE redemptions (
        id text PRIMARY KEY, household_id text NOT NULL REFERENCES households(id),
        user_id text NOT NULL REFERENCES users(id), reward_id text NOT NULL REFERENCES rewards(id),
        request_key text NOT NULL, title text NOT NULL, cost integer NOT NULL,
        fulfilled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id, request_key)
      )`,
      `CREATE TABLE unlocks (
        user_id text NOT NULL REFERENCES users(id), outfit text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, outfit)
      )`,
      `CREATE TABLE setup_guard (id integer PRIMARY KEY CHECK(id = 1), completed boolean NOT NULL DEFAULT false)`,
      `INSERT INTO setup_guard (id) VALUES (1)`,
      `CREATE INDEX completions_household_week ON completions(household_id, week_key)`,
      `CREATE INDEX tasks_household ON tasks(household_id)`,
      `CREATE INDEX users_household ON users(household_id)`,
      `CREATE INDEX sessions_expires ON sessions(expires_at)`,
      `INSERT INTO schema_migrations(version) VALUES (1)`,
    ]) await q.query(sql);
  });
}
