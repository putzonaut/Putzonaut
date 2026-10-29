import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { database, migrate } from '../server/database.ts';
import type { Database } from '../server/database.ts';
import { createApp } from '../server/app.ts';
import { localDay, weekKey, occurrenceKey } from '../server/domain.ts';

let db: Database; let server: Server; let base: string; let owner = ''; let member = ''; let current = new Date('2026-10-29T16:00:00Z');
const origin = 'https://putzonaut.test';
async function request(path: string, { method = 'GET', body, cookie, requestOrigin = origin }: { method?: string; body?: any; cookie?: string; requestOrigin?: string } = {}) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  const session = response.headers.get('set-cookie')?.split(';')[0];
  return { status: response.status, body: data, cookie: session, headers: response.headers };
}
before(async () => {
  db = await database(process.env.TEST_DATABASE_URL);
  await migrate(db);
  const app = createApp(db, { origin, setupToken: 'test-setup-token', production: true, now: () => current });
  server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;
});
after(async () => { server?.closeAllConnections(); await new Promise<void>(resolve => server?.close(() => resolve())); await db?.close(); });

test('Calendar uses household timezone and Monday weeks across year/DST boundaries', () => {
  assert.equal(localDay(new Date('2026-10-29T23:30:00Z'), 'Europe/Berlin'), '2026-10-30');
  assert.equal(weekKey(new Date('2027-01-01T12:00:00Z'), 'Europe/Berlin'), '2026-12-28');
  assert.equal(occurrenceKey('once', current, 'Europe/Berlin'), 'once');
  assert.equal(localDay(new Date('2026-03-29T22:30:00Z'), 'Europe/Berlin'), '2026-03-30');
});
test('Private API and setup require authentication and correct origin/setup token', async () => {
  assert.equal((await request('/state')).status, 401);
  assert.equal((await request('/bootstrap')).body.needsSetup, true);
  const body = { name: 'Denny', username: 'denny', password: 'A-test-password-123!', householdName: 'Sternencrew', setupToken: 'incorrect' };
  assert.equal((await request('/auth/setup', { method: 'POST', body })).status, 403);
  assert.equal((await request('/auth/setup', { method: 'POST', body, requestOrigin: 'https://evil.test' })).status, 403);
  const result = await request('/auth/setup', { method: 'POST', body: { ...body, setupToken: 'test-setup-token' } });
  assert.equal(result.status, 201); owner = result.cookie!;
  assert.match(result.headers.get('set-cookie')!, /HttpOnly/);
  assert.match(result.headers.get('set-cookie')!, /Secure/);
  const state = await request('/state', { cookie: owner });
  assert.equal(state.status, 200); assert.equal(state.body.user.stars, 0); assert.equal(state.body.user.xp, 0); assert.equal(state.body.members.length, 1);
  assert.equal(state.body.tasks.length, 6); assert.equal(state.body.rewards.length, 3);
  assert.equal(state.headers.get('cache-control'), 'no-store'); assert.equal('password_hash' in state.body.user, false);
  assert.equal((await request('/auth/setup', { method: 'POST', body: { ...body, setupToken: 'test-setup-token' } })).status, 409);
});
test('Invitation creates a second account and is single use', async () => {
  const result = await request('/invitations', { method: 'POST', cookie: owner });
  assert.equal(result.status, 201);
  const body = { name: 'Mia', username: 'mia', password: 'Another-good-password!', invite: result.body.token };
  const joined = await request('/auth/join', { method: 'POST', body });
  assert.equal(joined.status, 201); member = joined.cookie!;
  assert.equal((await request('/auth/join', { method: 'POST', body: { ...body, username: 'other' } })).status, 410);
  const state = (await request('/state', { cookie: member })).body;
  assert.equal(state.members.length, 2); assert.equal(state.user.role, 'member');
  assert.equal((await request('/invitations', { method: 'POST', cookie: member })).status, 403);
  assert.equal((await request('/tasks', { method: 'POST', cookie: member, body: {} })).status, 403);
});
test('Two devices completing the same occurrence receive only one reward', async () => {
  const before = (await request('/state', { cookie: owner })).body;
  const task = before.tasks.find((t: any) => t.icon === 'vacuum');
  const results = await Promise.all([owner, member].map(cookie => request(`/tasks/${task.id}/complete`, { method: 'POST', cookie, body: { occurrenceKey: task.occurrenceKey } })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const state = (await request('/state', { cookie: owner })).body;
  assert.equal(state.members.reduce((sum: number, u: any) => sum + u.stars, 0), task.stars);
  assert.equal(state.members.reduce((sum: number, u: any) => sum + u.xp, 0), task.xp);
  assert.equal(state.household.weekCount, 1);
  assert.ok(state.tasks.find((t: any) => t.id === task.id).completion);
});
test('Recurrences reopen on a new local day and reject stale client occurrences', async () => {
  const oldState = (await request('/state', { cookie: owner })).body;
  const task = oldState.tasks.find((t: any) => t.icon === 'vacuum');
  current = new Date('2026-10-29T23:30:00Z');
  const state = (await request('/state', { cookie: owner })).body;
  const next = state.tasks.find((t: any) => t.id === task.id);
  assert.equal(next.completion, null); assert.equal(next.occurrenceKey, '2026-10-30');
  assert.equal((await request(`/tasks/${task.id}/complete`, { method: 'POST', cookie: owner, body: { occurrenceKey: task.occurrenceKey } })).status, 409);
  assert.equal((await request(`/tasks/${task.id}/complete`, { method: 'POST', cookie: owner, body: { occurrenceKey: next.occurrenceKey } })).status, 200);
});
test('Another household cannot read or mutate this household’s task', async () => {
  const householdId = randomUUID(); const userId = randomUUID();
  await db.query('INSERT INTO households(id,name) VALUES ($1,$2)', [householdId, 'Other family']);
  await db.query(`INSERT INTO users(id,household_id,username,name,password_hash,role) VALUES ($1,$2,'outside','Other','invalid','admin')`, [userId, householdId]);
  const foreignTask = randomUUID();
  await db.query(`INSERT INTO tasks(id,household_id,title,room,icon,minutes,xp,stars,cadence) VALUES ($1,$2,'Private task','Bad','bath',5,25,10,'once')`, [foreignTask,householdId]);
  assert.equal((await request(`/tasks/${foreignTask}/complete`, { method:'POST', cookie:owner, body:{occurrenceKey:'once'} })).status,404);
  const state = (await request('/state', { cookie: owner })).body;
  assert.equal(state.tasks.some((t: any) => t.id === foreignTask), false);
});
test('Custom tasks validate rewards; custom wishes and concurrent spending are safe', async () => {
  assert.equal((await request('/tasks', { method:'POST', cookie:owner, body:{ title:'Bad values',room:'Bad',icon:'bath',minutes:2,xp:-1,stars:0,cadence:'once' } })).status,400);
  const task = await request('/tasks', { method:'POST', cookie:owner, body:{ title:'Test mission',room:'Bad',icon:'bath',minutes:10,xp:80,stars:80,cadence:'once' } });
  assert.equal(task.status,201);
  await request(`/tasks/${task.body.id}/complete`, { method:'POST', cookie:owner, body:{occurrenceKey:'once'} });
  const pre = (await request('/state', { cookie:owner })).body;
  const reward = await request('/rewards', { method:'POST',cookie:owner,body:{title:'Ein besonderer Wunsch',cost:pre.user.stars,icon:'gift'} });
  assert.equal(reward.status,201);
  const spends = await Promise.all([randomUUID(),randomUUID()].map(requestKey => request(`/rewards/${reward.body.id}/redeem`, {method:'POST',cookie:owner,body:{requestKey}})));
  assert.deepEqual(spends.map(r=>r.status).sort(),[200,409]);
  const postState = (await request('/state', {cookie:owner})).body;
  assert.equal(postState.user.stars,0); assert.equal(postState.redemptions.length,1);
  const success = spends.find(r=>r.status===200)!;
  const repeated = await request(`/rewards/${reward.body.id}/redeem`, {method:'POST',cookie:owner,body:{requestKey:success.body.request_key}});
  assert.equal(repeated.status,200); assert.equal(repeated.body.id,success.body.id);
  assert.equal((await request(`/redemptions/${success.body.id}/fulfill`, {method:'POST',cookie:member})).status,403);
  assert.equal((await request(`/redemptions/${success.body.id}/fulfill`, {method:'POST',cookie:owner})).status,200);
});
test('Cosmetic purchases are charged once and locked outfits require their level', async () => {
  assert.equal((await request('/outfits/sun/equip',{method:'POST',cookie:owner})).status,409);
  assert.equal((await request('/outfits/comet/equip',{method:'POST',cookie:owner})).status,409);
  const user = (await request('/state',{cookie:owner})).body.user;
  await db.query('UPDATE users SET stars=350 WHERE id=$1',[user.id]);
  assert.equal((await request('/outfits/comet/equip',{method:'POST',cookie:owner})).status,200);
  assert.equal((await request('/outfits/comet/equip',{method:'POST',cookie:owner})).status,200);
  const state = (await request('/state',{cookie:owner})).body;
  assert.equal(state.user.stars,50); assert.equal(state.user.outfit,'comet');
});
test('A second connected session receives a change event after a household mutation', { timeout: 5000 }, async () => {
  const controller = new AbortController();
  const response = await fetch(base + '/events', { headers: { Cookie: member }, signal: controller.signal });
  assert.equal(response.status, 200);
  const reader = response.body!.getReader();
  const ready = await reader.read();
  assert.match(new TextDecoder().decode(ready.value), /event: ready/);
  const changed = reader.read();
  await request('/household', { method:'PATCH', cookie:owner, body:{name:'Sternencrew',goalTitle:'Zusammen zum Filmabend',weekGoal:24} });
  assert.match(new TextDecoder().decode((await changed).value), /event: change/);
  controller.abort();
});
test('Authentication errors, password change and logout revoke sessions', async () => {
  assert.equal((await request('/auth/login',{method:'POST',body:{username:'denny',password:'wrong'}})).status,401);
  const changed = await request('/auth/password',{method:'POST',cookie:owner,body:{currentPassword:'A-test-password-123!',newPassword:'Even-better-password-321!'}});
  assert.equal(changed.status,200);
  assert.equal((await request('/state',{cookie:owner})).status,401);
  owner = changed.cookie!;
  assert.equal((await request('/auth/logout',{method:'POST',cookie:owner})).status,200);
  assert.equal((await request('/state',{cookie:owner})).status,401);
  const login = await request('/auth/login',{method:'POST',body:{username:'denny',password:'Even-better-password-321!'}});
  assert.equal(login.status,200); owner = login.cookie!;
});
test('Migrations are safe to re-run and previous progress remains', async () => {
  await migrate(db);
  assert.equal((await request('/state',{cookie:owner})).body.user.stars,50);
  assert.equal((await request('/health')).body.version,'0.1.0');
});
