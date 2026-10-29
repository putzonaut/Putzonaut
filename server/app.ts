import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { randomBytes, randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import type { Database } from './database.ts';
import { AppError, occurrenceKey, weekKey, publicUser, seedHousehold, OUTFITS } from './domain.ts';
import { hashPassword, verifyPassword, hashToken, cookieToken, requireUser, createSession } from './auth.ts';

type Config = { origin?: string; production?: boolean; setupToken: string; now?: () => Date; staticDir?: string; trustProxy?: boolean };
const identity = z.object({ name: z.string().trim().min(1).max(40), username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{3,40}$/), password: z.string().min(10).max(128) });
const taskSchema = z.object({ title: z.string().trim().min(2).max(80), room: z.enum(['Küche', 'Wohnen', 'Bad', 'Haushalt']), icon: z.enum(['vacuum', 'dishes', 'laundry', 'plant', 'bath', 'trash', 'sparkles']), minutes: z.number().int().min(1).max(180), xp: z.number().int().min(1).max(1000), stars: z.number().int().min(0).max(500), cadence: z.enum(['once', 'daily', 'weekly']) });
const rewardSchema = z.object({ title: z.string().trim().min(2).max(60), cost: z.number().int().min(1).max(10000), icon: z.enum(['film', 'ice', 'meal', 'gift']) });
const admin = (user: any) => { if (user.role !== 'admin') throw new AppError(403, 'Das kann nur die Person, die eure Crew verwaltet.'); };

export function createApp(db: Database, config: Config) {
  const app = express();
  const events = new EventEmitter(); events.setMaxListeners(200);
  const now = config.now || (() => new Date());
  const secure = !!config.origin?.startsWith('https:');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: config.production ? { directives: { connectSrc: ["'self'"], upgradeInsecureRequests: secure ? [] : null } } : false,
    strictTransportSecurity: secure ? undefined : false,
  }));
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', (req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      const allowed = config.origin || `${req.protocol}://${req.get('host')}`;
      // In development the managed preview proxy may terminate TLS before Vite.
      let sameHostDev = false;
      try { sameHostDev = !!(!config.production && origin && new URL(origin).host === req.get('host')); } catch { /* reject malformed origins below */ }
      if (!origin || (origin !== allowed && !sameHostDev)) return next(new AppError(403, 'Diese Anfrage kommt nicht von Putzonaut. Bitte öffne die App erneut.'));
    }
    next();
  });
  const attempts = new Map<string, { count: number; until: number }>();
  app.use('/api/auth', (req, _res, next) => {
    if (req.method !== 'POST') return next();
    const key = req.ip || 'local'; const time = Date.now();
    for (const [k, v] of attempts) if (v.until < time) attempts.delete(k);
    const entry = attempts.get(key) || { count: 0, until: time + 15 * 60_000 };
    entry.count++; attempts.set(key, entry);
    if (entry.count > 30) return next(new AppError(429, 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.'));
    next();
  });
  const change = (householdId: string) => events.emit(householdId);
  const authed = (fn: (req: Request, res: Response, user: any) => Promise<any>) => async (req: Request, res: Response, next: NextFunction) => {
    try { await fn(req, res, await requireUser(db, req)); } catch (error) { next(error); }
  };

  app.get('/api/health', async (_req, res) => { await db.query('SELECT 1'); res.json({ status: 'ok', version: '0.1.0' }); });
  app.get('/api/bootstrap', async (_req, res) => {
    const { rows } = await db.query('SELECT completed FROM setup_guard WHERE id=1');
    res.json({ needsSetup: !rows[0].completed });
  });
  app.post('/api/auth/setup', async (req, res) => {
    const body = identity.extend({ householdName: z.string().trim().min(2).max(60), setupToken: z.string().max(200) }).parse(req.body);
    if (hashToken(body.setupToken) !== hashToken(config.setupToken)) throw new AppError(403, 'Der Einrichtungscode stimmt nicht.');
    const password = await hashPassword(body.password);
    const userId = randomUUID(); const householdId = randomUUID();
    await db.transaction(async q => {
      const { rows } = await q.query('SELECT completed FROM setup_guard WHERE id=1 FOR UPDATE');
      if (rows[0].completed) throw new AppError(409, 'Putzonaut ist bereits eingerichtet. Bitte melde dich an.');
      await q.query('INSERT INTO households(id,name) VALUES ($1,$2)', [householdId, body.householdName]);
      await q.query(`INSERT INTO users(id,household_id,username,name,password_hash,role) VALUES ($1,$2,$3,$4,$5,'admin')`, [userId, householdId, body.username, body.name, password]);
      await seedHousehold(q, householdId);
      await q.query('UPDATE setup_guard SET completed=true WHERE id=1');
    });
    await createSession(db, res, userId, secure); res.status(201).json({ ok: true });
  });
  app.post('/api/auth/login', async (req, res) => {
    const body = z.object({ username: z.string().trim().toLowerCase().max(40), password: z.string().max(128) }).parse(req.body);
    const { rows } = await db.query('SELECT * FROM users WHERE username=$1', [body.username]);
    // Always derive a key to avoid revealing whether a username exists by timing.
    const dummy = 'scrypt$8f604399b9988743a77b5419f362c3bd$' + '00'.repeat(64);
    const valid = await verifyPassword(body.password, rows[0]?.password_hash || dummy);
    if (!rows[0] || !valid) throw new AppError(401, 'Benutzername oder Passwort stimmt nicht.');
    await db.query('DELETE FROM sessions WHERE expires_at < now()');
    await createSession(db, res, rows[0].id, secure); res.json({ ok: true });
  });
  app.post('/api/auth/logout', authed(async (req, res) => {
    await db.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(cookieToken(req)!)]);
    res.clearCookie('putzonaut_session', { path: '/', httpOnly: true, secure, sameSite: 'lax' }); res.json({ ok: true });
  }));
  app.post('/api/auth/password', authed(async (req, res, user) => {
    const body = z.object({ currentPassword: z.string().max(128), newPassword: z.string().min(10).max(128) }).parse(req.body);
    if (!await verifyPassword(body.currentPassword, user.password_hash)) throw new AppError(403, 'Dein bisheriges Passwort stimmt nicht.');
    const password = await hashPassword(body.newPassword);
    await db.transaction(async q => {
      await q.query('UPDATE users SET password_hash=$1 WHERE id=$2', [password, user.id]);
      await q.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
    });
    await createSession(db, res, user.id, secure); res.json({ ok: true });
  }));
  app.post('/api/invitations', authed(async (_req, res, user) => {
    admin(user); const token = randomBytes(24).toString('hex');
    await db.query(`INSERT INTO invitations(token_hash,household_id,created_by,expires_at) VALUES ($1,$2,$3,now()+interval '7 days')`, [hashToken(token), user.household_id, user.id]);
    res.status(201).json({ token, expiresInDays: 7 });
  }));
  app.post('/api/auth/join', async (req, res) => {
    const body = identity.extend({ invite: z.string().regex(/^[a-f0-9]{48}$/) }).parse(req.body);
    const password = await hashPassword(body.password); const userId = randomUUID();
    let householdId = '';
    await db.transaction(async q => {
      const { rows } = await q.query('SELECT * FROM invitations WHERE token_hash=$1 AND expires_at>now() AND used_at IS NULL FOR UPDATE', [hashToken(body.invite)]);
      if (!rows[0]) throw new AppError(410, 'Diese Einladung ist abgelaufen oder wurde schon benutzt.');
      householdId = rows[0].household_id;
      await q.query(`INSERT INTO users(id,household_id,username,name,password_hash,role) VALUES ($1,$2,$3,$4,$5,'member')`, [userId, householdId, body.username, body.name, password]);
      await q.query('UPDATE invitations SET used_at=now() WHERE token_hash=$1', [hashToken(body.invite)]);
    });
    await createSession(db, res, userId, secure); change(householdId); res.status(201).json({ ok: true });
  });

  app.get('/api/state', authed(async (_req, res, user) => {
    const household = (await db.query('SELECT * FROM households WHERE id=$1', [user.household_id])).rows[0];
    const date = now(); const week = weekKey(date, household.timezone);
    const tasks = (await db.query(`SELECT * FROM tasks WHERE household_id=$1 AND NOT archived ORDER BY created_at,id`, [user.household_id])).rows;
    const completions = (await db.query(`SELECT c.*,u.name AS user_name,t.title FROM completions c JOIN users u ON u.id=c.user_id
      JOIN tasks t ON t.id=c.task_id WHERE c.household_id=$1 ORDER BY c.created_at DESC`, [user.household_id])).rows;
    const members = (await db.query('SELECT * FROM users WHERE household_id=$1 ORDER BY created_at', [user.household_id])).rows;
    const rewards = (await db.query('SELECT * FROM rewards WHERE household_id=$1 AND NOT archived ORDER BY created_at,id', [user.household_id])).rows;
    const redemptions = (await db.query(`SELECT r.*,u.name AS user_name FROM redemptions r JOIN users u ON u.id=r.user_id
      WHERE r.household_id=$1 ORDER BY r.created_at DESC LIMIT 40`, [user.household_id])).rows;
    const unlocks = (await db.query('SELECT outfit FROM unlocks WHERE user_id=$1', [user.id])).rows.map(x => x.outfit);
    const thisWeek = completions.filter(c => c.week_key === week);
    res.json({ user: publicUser(user), household: { id: household.id, name: household.name, goalTitle: household.goal_title, weekGoal: household.week_goal, timezone: household.timezone, weekCount: thisWeek.length },
      tasks: tasks.map(t => ({ id: t.id, title: t.title, room: t.room, icon: t.icon, minutes: t.minutes, xp: t.xp, stars: t.stars, cadence: t.cadence, occurrenceKey: occurrenceKey(t.cadence, date, household.timezone),
        completion: completions.find(c => c.task_id === t.id && c.occurrence_key === occurrenceKey(t.cadence, date, household.timezone)) || null })),
      members: members.map(m => ({ ...publicUser(m), weekCount: thisWeek.filter(c => c.user_id === m.id).length })),
      rewards, redemptions, outfits: OUTFITS.map(o => ({ ...o, unlocked: o.id === 'starter' || unlocks.includes(o.id) })),
      recent: completions.slice(0, 8).map(c => ({ id: c.id, title: c.title, name: c.user_name, createdAt: c.created_at })),
      completedCount: completions.filter(c => c.user_id === user.id).length,
    });
  }));
  app.get('/api/events', authed(async (req, res, user) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' }); res.flushHeaders();
    res.write('event: ready\ndata: {}\n\n');
    const listener = () => res.write('event: change\ndata: {}\n\n');
    events.on(user.household_id, listener);
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 20_000);
    const reconnect = setTimeout(() => res.end(), 30 * 60_000);
    req.on('close', () => { clearInterval(heartbeat); clearTimeout(reconnect); events.off(user.household_id, listener); });
  }));

  app.post('/api/tasks', authed(async (req, res, user) => {
    admin(user); const t = taskSchema.parse(req.body); const id = randomUUID();
    await db.query(`INSERT INTO tasks (id,household_id,title,room,icon,minutes,xp,stars,cadence) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [id, user.household_id, t.title, t.room, t.icon, t.minutes, t.xp, t.stars, t.cadence]);
    change(user.household_id); res.status(201).json({ id });
  }));
  app.patch('/api/tasks/:id', authed(async (req, res, user) => {
    admin(user); const t = taskSchema.parse(req.body);
    const { rows } = await db.query(`UPDATE tasks SET title=$1,room=$2,icon=$3,minutes=$4,xp=$5,stars=$6,cadence=$7
      WHERE id=$8 AND household_id=$9 AND NOT archived RETURNING id`, [t.title,t.room,t.icon,t.minutes,t.xp,t.stars,t.cadence,req.params.id,user.household_id]);
    if (!rows.length) throw new AppError(404, 'Diese Mission wurde nicht gefunden.');
    change(user.household_id); res.json({ ok: true });
  }));
  app.delete('/api/tasks/:id', authed(async (req, res, user) => {
    admin(user); await db.query('UPDATE tasks SET archived=true WHERE id=$1 AND household_id=$2', [req.params.id,user.household_id]);
    change(user.household_id); res.json({ ok: true });
  }));
  app.post('/api/tasks/:id/complete', authed(async (req, res, user) => {
    const body = z.object({ occurrenceKey: z.string().min(1).max(20) }).parse(req.body);
    const result = await db.transaction(async q => {
      const { rows } = await q.query(`SELECT t.*,h.timezone FROM tasks t JOIN households h ON h.id=t.household_id
        WHERE t.id=$1 AND t.household_id=$2 AND NOT t.archived FOR UPDATE OF t`, [req.params.id,user.household_id]);
      const task = rows[0]; if (!task) throw new AppError(404, 'Diese Mission wurde nicht gefunden.');
      const date = now(); const key = occurrenceKey(task.cadence, date, task.timezone);
      if (key !== body.occurrenceKey) throw new AppError(409, 'Eine neue Aufgabenrunde hat begonnen. Bitte lade die Missionen neu.');
      const existing = await q.query('SELECT id FROM completions WHERE task_id=$1 AND occurrence_key=$2', [task.id,key]);
      if (existing.rows.length) throw new AppError(409, 'Diese Mission wurde schon erledigt. Eure Punkte sind bereits gutgeschrieben.');
      await q.query(`INSERT INTO completions(id,household_id,task_id,user_id,occurrence_key,week_key,xp,stars) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [randomUUID(),user.household_id,task.id,user.id,key,weekKey(date,task.timezone),task.xp,task.stars]);
      const updated = await q.query('UPDATE users SET total_xp=total_xp+$1,stars=stars+$2 WHERE id=$3 RETURNING *', [task.xp,task.stars,user.id]);
      return { title: task.title, xp: task.xp, stars: task.stars, user: publicUser(updated.rows[0]) };
    });
    change(user.household_id); res.json(result);
  }));
  app.post('/api/rewards', authed(async (req, res, user) => {
    admin(user); const body = rewardSchema.parse(req.body); const id = randomUUID();
    await db.query('INSERT INTO rewards(id,household_id,title,cost,icon) VALUES ($1,$2,$3,$4,$5)', [id,user.household_id,body.title,body.cost,body.icon]);
    change(user.household_id); res.status(201).json({ id });
  }));
  app.patch('/api/rewards/:id', authed(async (req, res, user) => {
    admin(user); const body = rewardSchema.parse(req.body);
    const { rows } = await db.query('UPDATE rewards SET title=$1,cost=$2,icon=$3 WHERE id=$4 AND household_id=$5 AND NOT archived RETURNING id', [body.title,body.cost,body.icon,req.params.id,user.household_id]);
    if (!rows.length) throw new AppError(404, 'Diese Belohnung wurde nicht gefunden.');
    change(user.household_id); res.json({ ok: true });
  }));
  app.delete('/api/rewards/:id', authed(async (req, res, user) => {
    admin(user); await db.query('UPDATE rewards SET archived=true WHERE id=$1 AND household_id=$2', [req.params.id,user.household_id]);
    change(user.household_id); res.json({ ok: true });
  }));
  app.post('/api/rewards/:id/redeem', authed(async (req, res, user) => {
    const body = z.object({ requestKey: z.uuid() }).parse(req.body);
    const result = await db.transaction(async q => {
      const locked = (await q.query('SELECT * FROM users WHERE id=$1 FOR UPDATE', [user.id])).rows[0];
      const previous = (await q.query('SELECT * FROM redemptions WHERE user_id=$1 AND request_key=$2', [user.id,body.requestKey])).rows[0];
      if (previous) {
        if (previous.reward_id !== req.params.id) throw new AppError(409, 'Diese Einlösung gehört zu einer anderen Belohnung.');
        return previous;
      }
      const reward = (await q.query('SELECT * FROM rewards WHERE id=$1 AND household_id=$2 AND NOT archived FOR SHARE', [req.params.id,user.household_id])).rows[0];
      if (!reward) throw new AppError(404, 'Diese Belohnung wurde nicht gefunden.');
      if (locked.stars < reward.cost) throw new AppError(409, 'Für diesen Wunsch fehlen dir noch Sterne.');
      await q.query('UPDATE users SET stars=stars-$1 WHERE id=$2', [reward.cost,user.id]);
      return (await q.query(`INSERT INTO redemptions(id,household_id,user_id,reward_id,request_key,title,cost) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [randomUUID(),user.household_id,user.id,reward.id,body.requestKey,reward.title,reward.cost])).rows[0];
    });
    change(user.household_id); res.json(result);
  }));
  app.post('/api/redemptions/:id/fulfill', authed(async (req, res, user) => {
    admin(user); const { rows } = await db.query('UPDATE redemptions SET fulfilled_at=COALESCE(fulfilled_at,now()) WHERE id=$1 AND household_id=$2 RETURNING id', [req.params.id,user.household_id]);
    if (!rows.length) throw new AppError(404, 'Diese Einlösung wurde nicht gefunden.');
    change(user.household_id); res.json({ ok: true });
  }));
  app.post('/api/outfits/:id/equip', authed(async (req, res, user) => {
    const outfit = OUTFITS.find(o => o.id === req.params.id); if (!outfit) throw new AppError(404, 'Diesen Anzug gibt es nicht.');
    await db.transaction(async q => {
      const locked = (await q.query('SELECT * FROM users WHERE id=$1 FOR UPDATE', [user.id])).rows[0];
      const unlocked = outfit.id === 'starter' || !!(await q.query('SELECT outfit FROM unlocks WHERE user_id=$1 AND outfit=$2', [user.id,outfit.id])).rows.length;
      if (!unlocked) {
        if (Math.floor(locked.total_xp / 500) + 1 < outfit.level) throw new AppError(409, `Dieser Anzug ist ab Level ${outfit.level} verfügbar.`);
        if (locked.stars < outfit.cost) throw new AppError(409, 'Dir fehlen noch Sterne für diesen Anzug.');
        await q.query('UPDATE users SET stars=stars-$1 WHERE id=$2', [outfit.cost,user.id]);
        await q.query('INSERT INTO unlocks(user_id,outfit) VALUES ($1,$2)', [user.id,outfit.id]);
      }
      await q.query('UPDATE users SET outfit=$1 WHERE id=$2', [outfit.id,user.id]);
    });
    change(user.household_id); res.json({ ok: true });
  }));
  app.patch('/api/household', authed(async (req, res, user) => {
    admin(user); const body = z.object({ name: z.string().trim().min(2).max(60), goalTitle: z.string().trim().min(2).max(80), weekGoal: z.number().int().min(1).max(500) }).parse(req.body);
    await db.query('UPDATE households SET name=$1,goal_title=$2,week_goal=$3 WHERE id=$4', [body.name,body.goalTitle,body.weekGoal,user.household_id]);
    change(user.household_id); res.json({ ok: true });
  }));
  app.use('/api', (_req, _res, next) => next(new AppError(404, 'Diese Funktion wurde nicht gefunden.')));
  if (config.staticDir) {
    app.use(express.static(config.staticDir, { index: false, setHeaders(res, file) {
      res.setHeader('Cache-Control', /[/\\]assets[/\\]/.test(file) ? 'public,max-age=31536000,immutable' : 'no-cache');
    } }));
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(config.staticDir!, 'index.html')));
  }
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Bitte prüfe deine Eingaben. Namen dürfen nicht leer und Zahlen nicht negativ sein.', fields: error.issues.map(i => i.path.join('.')) });
    if (error instanceof AppError) return res.status(error.status).json({ error: error.message });
    if (error.code === '23505') return res.status(409).json({ error: 'Dieser Eintrag existiert bereits. Bitte prüfe den Benutzernamen oder lade die Ansicht neu.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Die Anfrage konnte nicht gelesen werden.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Die Anfrage ist zu groß.' });
    console.error('Request failed:', error.name, error.code || '', error.message);
    res.status(500).json({ error: 'Das hat gerade nicht geklappt. Bitte versuche es noch einmal.' });
  });
  return app;
}
