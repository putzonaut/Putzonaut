import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {localDay,weekKey} from '../server/domain.ts';
const origin='https://putzonaut-test.denny-subke.chatgpt.site';
const now=new Date('2026-10-29T12:00:00Z');
let mf:Miniflare;let repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});const db=await mf.getD1Database('DB');repo=new Repository(db);const sql=await readFile(new URL('../drizzle/0000_steady_zombie.sql',import.meta.url),'utf8');for(const statement of sql.split('--> statement-breakpoint'))if(statement.trim())await db.prepare(statement).run();});
after(async()=>{await mf.dispose();});
async function call(user:string|null,path:string,method='GET',body?:unknown,date=now,extraHeaders:Record<string,string>={}){const response=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...extraHeaders},...(body!==undefined?{body:JSON.stringify(body)}:{})}),user?{userId:user}:null,repo,{now:()=>date});return {status:response.status,body:await response.json() as any,headers:response.headers};}
async function setup(starterTasks=true){const user=crypto.randomUUID();const result=await call(user,'/auth/setup','POST',{name:'Alex',householdName:'Sternencrew',starterTasks});assert.equal(result.status,201);return user;}
async function state(user:string,date=now){const r=await call(user,'/state','GET',undefined,date);assert.equal(r.status,200);return r.body;}
async function complete(user:string,task:any,date=now){return call(user,`/tasks/${task.id}/complete`,'POST',{occurrenceKey:task.occurrenceKey},date);}
async function addTask(user:string,values:Record<string,unknown>={}){const result=await call(user,'/tasks','POST',{title:'Spezialmission',room:'Haushalt',icon:'sparkles',minutes:10,xp:100,stars:200,cadence:'daily',...values});assert.equal(result.status,200);return (await state(user)).tasks.find((t:any)=>t.id===result.body.id);}
test('real onboarding starts empty, persists across repository instances and hides account IDs',async()=>{const u=await setup();const s=await state(u);assert.equal(s.user.xp,0);assert.equal(s.user.stars,0);assert.equal(s.members.length,1);assert.equal(s.tasks.length,6);assert.equal(s.rewards.length,0);assert.equal(s.household.weekCount,0);assert.equal(JSON.stringify(s).includes(u),false);const another=new Repository(repo.db);assert.ok(await another.forAccount(u));const response=await call(u,'/state');assert.match(response.headers.get('Cache-Control')!,/no-store/);});
test('parallel setup produces a single household without orphaned rows',async()=>{const u=crypto.randomUUID();const before=await repo.db.prepare('SELECT count(*) AS n FROM households').first<{n:number}>();const results=await Promise.all([call(u,'/auth/setup','POST',{name:'Alex',householdName:'Crew A'}),call(u,'/auth/setup','POST',{name:'Alex',householdName:'Crew B'})]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);const after=await repo.db.prepare('SELECT count(*) AS n FROM households').first<{n:number}>();assert.equal(after!.n,before!.n+1);});
test('concurrent completion awards points and history exactly once',async()=>{const u=await setup();const t=(await state(u)).tasks[0];const results=await Promise.all(Array.from({length:8},()=>complete(u,t)));assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===409).length,7);const s=await state(u);assert.equal(s.user.xp,t.xp);assert.equal(s.user.stars,t.stars);assert.equal(s.household.weekCount,1);const history=await call(u,'/history');assert.equal(history.body.items.length,1);});
test('two members cannot consume the same invitation and member permissions are enforced',async()=>{const owner=await setup();const invite=(await call(owner,'/invitations','POST',{})).body.token;const users=[crypto.randomUUID(),crypto.randomUUID()];const joined=await Promise.all(users.map(u=>call(u,'/auth/join','POST',{name:'Crewmitglied',invite})));assert.deepEqual(joined.map(r=>r.status).sort(),[201,410]);const valid=users[joined.findIndex(r=>r.status===201)];assert.equal((await state(owner)).members.length,2);assert.equal((await call(valid,'/household','PATCH',{name:'Hijack',goalTitle:'Hijack',weekGoal:1})).status,403);assert.equal((await call(valid,'/export')).status,403);const expired=(await call(owner,'/invitations','POST',{})).body.token;assert.equal((await call(crypto.randomUUID(),'/auth/join','POST',{name:'Late',invite:expired},new Date('2026-11-07T12:00:00Z'))).status,410);});
test('households stay isolated and assignments cannot be bypassed',async()=>{const a=await setup();const b=await setup();const t=(await state(a)).tasks[0];assert.equal((await complete(b,t)).status,404);assert.equal((await state(b)).user.xp,0);const invitation=(await call(a,'/invitations','POST',{})).body.token;const m=crypto.randomUUID();assert.equal((await call(m,'/auth/join','POST',{name:'Member',invite:invitation})).status,201);const own=await state(a);const assigned=await addTask(a,{assignedTo:own.user.id});assert.equal((await complete(m,assigned)).status,403);assert.equal((await call(m,'/profile','PATCH',{name:'Changed',role:'admin',stars:9000})).status,200);assert.equal((await state(m)).user.role,'member');assert.equal((await state(m)).user.stars,0);});
test('competing redemptions cannot overdraw a balance, duplicate requests are idempotent',async()=>{const u=await setup(false);const t=await addTask(u);assert.equal((await complete(u,t)).status,200);const reward=(await call(u,'/rewards','POST',{title:'Filmabend',cost:120,icon:'film'})).body;const keys=[crypto.randomUUID(),crypto.randomUUID()];const results=await Promise.all(keys.map(key=>call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:key})));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const used=keys[results.findIndex(r=>r.status===200)];assert.equal((await call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:used})).status,200);const s=await state(u);assert.equal(s.user.stars,80);assert.equal(s.redemptions.length,1);});
test('concurrent retries with the same reward request charge only once',async()=>{const u=await setup(false);await complete(u,await addTask(u));const reward=(await call(u,'/rewards','POST',{title:'Eis essen',cost:100,icon:'ice'})).body;const key=crypto.randomUUID();const results=await Promise.all([call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:key}),call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:key})]);assert.deepEqual(results.map(r=>r.status),[200,200]);assert.equal((await state(u)).user.stars,100);});
test('daily and weekly recurrence, stale requests, and Berlin calendar boundaries work',async()=>{assert.equal(localDay(new Date('2026-10-25T23:30:00Z')),'2026-10-26');assert.equal(weekKey(new Date('2027-01-01T12:00:00Z')),'2026-12-28');const u=await setup();let s=await state(u);await complete(u,s.tasks[0]);await complete(u,s.tasks[3]);const next=new Date('2026-10-30T12:00:00Z');const after=await state(u,next);assert.equal(after.tasks[0].completion,null);assert.ok(after.tasks[3].completion);assert.equal((await complete(u,s.tasks[0],next)).status,409);assert.equal((await complete(u,after.tasks[0],next)).status,200);const monday=await state(u,new Date('2026-11-02T12:00:00Z'));assert.equal(monday.household.weekCount,0);assert.equal(monday.user.xp,s.tasks[0].xp*2+s.tasks[3].xp);});
test('outfits enforce levels and funds, while equipped purchases remain unlocked',async()=>{const u=await setup(false);assert.equal((await call(u,'/outfits/comet/equip','POST',{})).status,409);const t=await addTask(u,{xp:1000,stars:500});await complete(u,t);assert.equal((await call(u,'/outfits/comet/equip','POST',{})).status,200);await call(u,'/outfits/starter/equip','POST',{});await call(u,'/outfits/comet/equip','POST',{});assert.equal((await state(u)).user.stars,200);assert.equal((await call(u,'/outfits/sun/equip','POST',{})).status,409);});
test('archives preserve history, wishes and points; export excludes identities and invitation secrets',async()=>{const u=await setup();const t=(await state(u)).tasks[0];await complete(u,t);assert.equal((await call(u,`/tasks/${t.id}`,'DELETE',{})).status,200);const invite=(await call(u,'/invitations','POST',{})).body.token;const exported=await call(u,'/export');assert.equal(exported.body.members[0].xp,t.xp);assert.equal(JSON.stringify(exported.body).includes(u),false);assert.equal(JSON.stringify(exported.body).includes(invite),false);assert.equal((await call(u,'/history')).body.items[0].title,t.title);});
test('unauthenticated, cross-origin and oversized writes are rejected without storing changes',async()=>{assert.equal((await call(null,'/state')).status,401);const u=await setup();const invalid=new Request(origin+'/api/profile',{method:'PATCH',headers:{Origin:'https://elsewhere.example','Content-Type':'application/json'},body:JSON.stringify({name:'Bad'})});assert.equal((await handleApi(invalid,{userId:u},repo)).status,403);const huge=await call(u,'/profile','PATCH',{name:'x'.repeat(17000)});assert.equal(huge.status,413);assert.equal((await state(u)).user.name,'Alex');});
test('captains can revoke invitations and invalid due dates are rejected',async()=>{const u=await setup();const invitation=(await call(u,'/invitations','POST',{})).body.token;const list=await call(u,'/invitations');assert.equal(list.body.items.length,1);assert.equal('hash' in list.body.items[0],false);assert.equal((await call(u,`/invitations/${list.body.items[0].id}`,'DELETE',{})).status,200);assert.equal((await call(crypto.randomUUID(),'/auth/join','POST',{name:'Member',invite:invitation})).status,410);const t=(await state(u)).tasks[0];assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',{...t,dueDate:'2026-02-30'})).status,400);});

async function join(owner:string,name='Robin'){const u=crypto.randomUUID();const invitation=(await call(owner,'/invitations','POST',{})).body.token;assert.equal((await call(u,'/auth/join','POST',{name,invite:invitation})).status,201);return u;}
async function child(owner:string,name='Mini'){const r=await call(owner,'/children','POST',{name});assert.equal(r.status,200);return r.body.id as string;}
const selected=(id:string)=>({'X-Putzonaut-Profile':id});

test('onboarding supports household types and selected templates, invitation previews disclose no member data',async()=>{
 for(const [kind,goal] of [['family',24],['couple',14],['shared',21],['solo',7]] as const){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'New',householdName:'Neue Crew',kind,taskTemplates:['plant','trash']})).status,201);const s=await state(u);assert.equal(s.household.kind,kind);assert.equal(s.household.weekGoal,goal);assert.equal(s.tasks.length,2);assert.equal(s.user.stars,0);}
 const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'New',householdName:'Crew',taskTemplates:['unknown']})).status,400);assert.equal(await repo.forAccount(u),null);
 const owner=await setup();const invite=(await call(owner,'/invitations','POST',{})).body.token;const preview=await call(u,'/auth/invitation','POST',{invite});assert.equal(preview.status,200);assert.equal(preview.body.memberCount,1);assert.equal(preview.body.name,'Sternencrew');assert.equal('members' in preview.body,false);assert.equal(JSON.stringify(preview.body).includes(owner),false);assert.equal(await repo.forAccount(u),null);
});

test('child profiles have no login and award their own progress while administrative actions stay blocked',async()=>{
 const u=await setup();const id=await child(u);let s=await state(u);const kid=s.members.find((m:any)=>m.id===id);assert.equal(kid.kind,'child');assert.equal(kid.guardianId,s.user.id);assert.equal(kid.xp,0);
 assert.equal((await repo.db.prepare('SELECT count(*) AS n FROM memberships WHERE household_id=?').bind(s.household.id).first<{n:number}>())!.n,1);
 const t=s.tasks[0];const headers=selected(id);const r=await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey},now,headers);assert.equal(r.status,200);
 s=(await call(u,'/state','GET',undefined,now,headers)).body;assert.equal(s.user.id,id);assert.equal(s.viewer.name,'Alex');assert.equal(s.user.xp,t.xp);assert.equal((await state(u)).user.xp,0);
 const log=(await call(u,'/history')).body.items.find((e:any)=>e.kind==='completion');assert.equal(log.name,'Mini');assert.equal(log.recordedByName,'Alex');assert.equal(log.recordedBy,s.viewer.id);
 for(const [path,method,body] of [['/invitations','POST',{}],['/children','POST',{name:'Bad'}],['/household/leave','POST',{}],['/household/close','POST',{confirmation:'Sternencrew'}],['/export','GET',undefined],['/household','PATCH',{name:'Bad',goalTitle:'Bad',weekGoal:1}]] as const){assert.equal((await call(u,path,method,body,now,headers)).status,403,path);}
 const reward=(await call(u,'/rewards','POST',{title:'Eis',cost:10,icon:'ice'})).body;assert.equal((await call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:crypto.randomUUID()},now,headers)).status,200);assert.equal((await call(u,'/state','GET',undefined,now,headers)).body.user.stars,t.stars-10);assert.equal((await state(u)).user.stars,0);
});

test('only guardians and the captain may accompany a child; reassignment revokes previous access',async()=>{
 const owner=await setup();const a=await join(owner,'A');const b=await join(owner,'B');const foreign=await setup();const id=await child(a);
 assert.equal((await call(b,'/state','GET',undefined,now,selected(id))).status,403);assert.equal((await call(foreign,'/state','GET',undefined,now,selected(id))).status,403);
 assert.equal((await call(a,`/members/${id}`,'PATCH',{name:'Renamed'})).status,200);const bId=(await state(b)).user.id;
 assert.equal((await call(a,`/members/${id}`,'PATCH',{name:'Renamed',guardianId:bId})).status,403);
 assert.equal((await call(owner,`/members/${id}`,'PATCH',{name:'Renamed',guardianId:(await state(foreign)).user.id})).status,400);
 assert.equal((await call(owner,`/members/${id}`,'PATCH',{name:'Renamed',guardianId:bId})).status,200);
 assert.equal((await call(a,'/state','GET',undefined,now,selected(id))).status,403);assert.equal((await call(b,'/state','GET',undefined,now,selected(id))).status,200);
 assert.equal((await call(owner,'/state','GET',undefined,now,selected(id))).status,200);
});

test('captain transfer is atomic, cannot target children or another household, and revokes invitations',async()=>{
 const owner=await setup();const a=await join(owner,'A');const b=await join(owner,'B');const kid=await child(owner);const foreign=await setup();
 const aId=(await state(a)).user.id;const bId=(await state(b)).user.id;
 assert.equal((await call(owner,'/household/transfer','POST',{memberId:kid})).status,400);
 assert.equal((await call(owner,'/household/transfer','POST',{memberId:(await state(foreign)).user.id})).status,400);
 assert.equal((await call(a,'/household/transfer','POST',{memberId:bId})).status,403);
 const invitation=(await call(owner,'/invitations','POST',{})).body.token;
 const results=await Promise.all([call(owner,'/household/transfer','POST',{memberId:aId}),call(owner,'/household/transfer','POST',{memberId:bId})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,403]);
 const s=await state(owner);assert.equal(s.user.role,'member');assert.equal(s.members.filter((m:any)=>m.role==='admin').length,1);
 assert.equal((await call(owner,'/invitations','POST',{})).status,403);assert.equal((await call(crypto.randomUUID(),'/auth/join','POST',{name:'Late',invite:invitation})).status,410);
});

test('leaving removes access atomically, preserves history and weekly progress, and releases assignments',async()=>{
 const owner=await setup();const u=await join(owner);const before=await state(u);const t=await addTask(owner,{assignedTo:before.user.id});assert.equal((await complete(u,t)).status,200);
 assert.equal((await call(u,'/household/leave','POST',{})).status,200);assert.equal(await repo.forAccount(u),null);assert.equal((await call(u,'/state')).status,404);
 const s=await state(owner);assert.equal(s.members.length,1);assert.equal(s.household.weekCount,1);assert.equal(s.tasks.find((x:any)=>x.id===t.id).assignedTo,null);assert.equal((await call(owner,'/history')).body.items.find((e:any)=>e.kind==='completion').name,'Robin');
 assert.equal((await call(u,'/auth/setup','POST',{name:'Robin',householdName:'Neue Crew',starterTasks:false})).status,201);assert.equal((await state(u)).user.stars,0);
 assert.equal((await call(u,'/profile','PATCH',{name:'Wrong'},now,{'X-Putzonaut-Household':before.household.id})).status,409);assert.equal((await state(u)).user.name,'Robin');
 await assert.rejects(repo.mutate(u,now,h=>{h.name='Wrong';return {result:{}};},{householdId:before.household.id,memberId:before.user.id}));
});

test('guardians cannot leave or be removed until their children have another guardian',async()=>{
 const owner=await setup();const u=await join(owner);const id=await child(u);const ownerId=(await state(owner)).user.id;const userId=(await state(u)).user.id;
 assert.equal((await call(u,'/household/leave','POST',{})).status,409);assert.equal((await call(owner,`/members/${userId}`,'DELETE',{})).status,409);
 assert.equal((await call(owner,`/members/${id}`,'PATCH',{name:'Mini',guardianId:ownerId})).status,200);
 assert.equal((await call(owner,`/members/${userId}`,'DELETE',{})).status,200);assert.equal((await call(u,'/state')).status,404);
 assert.equal((await call(owner,'/state','GET',undefined,now,selected(id))).status,200);
 assert.equal((await call(owner,`/members/${ownerId}`,'DELETE',{})).status,409);
});

test('removal of child profiles revokes selected-profile access and preserves earned progress',async()=>{
 const owner=await setup();const u=await join(owner);const other=await join(owner,'Other');const id=await child(u);const t=(await state(u)).tasks[0];
 assert.equal((await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey},now,selected(id))).status,200);
 assert.equal((await call(other,`/members/${id}`,'DELETE',{})).status,403);
 assert.equal((await call(u,`/members/${id}`,'DELETE',{})).status,200);assert.equal((await call(owner,'/state','GET',undefined,now,selected(id))).status,403);assert.equal((await state(owner)).household.weekCount,1);
 assert.equal((await call(u,`/members/${(await state(other)).user.id}`,'DELETE',{})).status,403);
});

test('closing a crew requires exact confirmation and frees all accounts without affecting other households',async()=>{
 const owner=await setup();const u=await join(owner);await child(owner);const other=await setup();const otherBefore=await state(other);const h=(await state(owner)).household;
 const invite=(await call(owner,'/invitations','POST',{})).body.token;
 assert.equal((await call(u,'/household/close','POST',{confirmation:h.name})).status,403);assert.equal((await call(owner,'/household/close','POST',{confirmation:'wrong'})).status,400);
 assert.equal((await call(owner,'/household/close','POST',{confirmation:h.name})).status,200);
 assert.equal(await repo.forAccount(owner),null);assert.equal(await repo.forAccount(u),null);assert.equal((await call(u,'/bootstrap')).body.needsSetup,true);
 const archived=JSON.parse((await repo.byId(h.id))!.document);assert.ok(archived.closedAt);assert.ok(archived.members.every((m:any)=>m.removedAt&&!m.accountId));assert.equal((await call(crypto.randomUUID(),'/auth/join','POST',{name:'Late',invite})).status,410);
 assert.equal((await state(other)).household.id,otherBefore.household.id);assert.equal((await call(owner,'/auth/setup','POST',{name:'New',householdName:'Restart',taskTemplates:[]})).status,201);
});

test('the twelve-member limit counts active profiles and concurrent child creation cannot exceed it',async()=>{
 const u=await setup();for(let i=0;i<10;i++)await child(u,`Child ${i}`);
 const results=await Promise.all([call(u,'/children','POST',{name:'Last A'}),call(u,'/children','POST',{name:'Last B'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal((await state(u)).members.length,12);
 const id=(await state(u)).members.find((m:any)=>m.kind==='child').id;assert.equal((await call(u,`/members/${id}`,'DELETE',{})).status,200);await child(u,'Replacement');assert.equal((await state(u)).members.length,12);
});

test('version 0.2 household documents remain readable and retain balances through new crew operations',async()=>{
 const u=await setup();await complete(u,(await state(u)).tasks[0]);const row=(await repo.forAccount(u))!;const old=JSON.parse(row.document);delete old.kind;delete old.closedAt;for(const m of old.members){delete m.kind;delete m.guardianId;delete m.removedAt;}
 await repo.db.prepare('UPDATE households SET document=? WHERE id=?').bind(JSON.stringify(old),row.id).run();
 const before=await state(u);assert.equal(before.household.kind,'family');assert.equal(before.user.kind,'account');await child(u);const after=await state(u);assert.equal(after.user.xp,before.user.xp);assert.equal(after.user.stars,before.user.stars);assert.equal(after.members.length,2);
});

test('removing a member while they finish a mission never restores access or loses a confirmed award',async()=>{
 const owner=await setup();const u=await join(owner);const memberId=(await state(u)).user.id;const task=(await state(u)).tasks[0];
 const [removal,completion]=await Promise.all([call(owner,`/members/${memberId}`,'DELETE',{}),complete(u,task)]);
 assert.equal(removal.status,200);assert.ok([200,403,404].includes(completion.status));assert.equal(await repo.forAccount(u),null);assert.equal((await call(u,'/state')).status,404);
 const completions=(await call(owner,'/history')).body.items.filter((e:any)=>e.kind==='completion');assert.equal(completions.length,completion.status===200?1:0);assert.equal((await state(owner)).household.weekCount,completions.length);
});

test('concurrent child creation and guardian departure cannot leave an orphaned profile',async()=>{
 const owner=await setup();const u=await join(owner);const id=(await state(u)).user.id;
 const [creation,departure]=await Promise.all([call(u,'/children','POST',{name:'Mini'}),call(u,'/household/leave','POST',{})]);
 const s=await state(owner);for(const m of s.members.filter((m:any)=>m.kind==='child'))assert.ok(s.members.some((g:any)=>g.id===m.guardianId&&g.kind==='account'));
 if(creation.status===200){assert.equal(departure.status,409);assert.ok(s.members.some((m:any)=>m.id===id));}else{assert.ok([403,404].includes(creation.status));assert.equal(departure.status,200);}
});

test('planned tasks reject early completions, invalid schedules and paused writes',async()=>{
 const u=await setup(false);const t=await addTask(u,{cadence:'weekdays',schedule:{startDate:'2026-10-29',weekdays:[5]}});assert.equal(t.status,'upcoming');assert.equal((await complete(u,t)).status,409);
 const tomorrow=new Date('2026-10-30T12:00:00Z'),ready=(await state(u,tomorrow)).tasks[0];assert.equal((await complete(u,ready,tomorrow)).status,200);
 for(const patch of [{cadence:'weekdays',schedule:{weekdays:[]}},{cadence:'interval',schedule:{intervalWeeks:0,startDate:'2026-10-29'}},{cadence:'monthly',schedule:{monthDay:32}},{schedule:{startDate:'2026-02-30'}}])assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',{...t,...patch})).status,400);
 const paused=await addTask(u);assert.equal((await call(u,`/tasks/${paused.id}/pause`,'POST',{from:'2026-10-29',until:'2026-11-04'})).status,200);assert.equal((await complete(u,paused)).status,409);assert.equal((await state(u)).tasks.find((x:any)=>x.id===paused.id).status,'paused');
 assert.equal((await call(u,`/tasks/${paused.id}/pause`,'POST',{from:'2026-10-28',until:null})).status,400);
 assert.equal((await call(u,`/tasks/${paused.id}/resume`,'POST',{})).status,200);assert.equal((await complete(u,(await state(u)).tasks.find((x:any)=>x.id===paused.id))).status,200);
});
test('weekly rotation controls the permitted member and departure releases their slot',async()=>{
 const u=await setup(false),a=await join(u,'A'),b=await join(u,'B');const aId=(await state(a)).user.id,bId=(await state(b)).user.id;
 const t=await addTask(u,{rotationIds:[aId,bId]});assert.equal(t.effectiveAssignedTo,aId);assert.equal((await complete(b,t)).status,403);assert.equal((await complete(a,t)).status,200);
 const next=new Date('2026-11-02T12:00:00Z'),round=(await state(b,next)).tasks[0];assert.equal(round.effectiveAssignedTo,bId);assert.equal((await complete(a,round,next)).status,403);assert.equal((await complete(b,round,next)).status,200);
 assert.equal((await call(u,`/members/${bId}`,'DELETE',{},next)).status,200);assert.deepEqual((await state(a,next)).tasks[0].rotationIds,[aId]);
});
test('child approval grants points exactly once, rejects unrelated reviewers and cannot be self-approved',async()=>{
 const u=await setup(false),a=await join(u),unrelated=await join(u),kid=await child(a);const t=await addTask(u,{approvalForChildren:true,assignedTo:kid});
 const r=await call(a,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey},now,selected(kid));assert.equal(r.body.pending,true);
 let s=(await call(a,'/state','GET',undefined,now,selected(kid))).body;assert.equal(s.user.stars,0);assert.equal(s.household.weekCount,0);assert.equal(s.tasks[0].status,'pending');const id=s.pendingCompletions[0].id;
 assert.equal((await call(a,`/completions/${id}/approve`,'POST',{},now,selected(kid))).status,403);assert.equal((await call(unrelated,`/completions/${id}/approve`,'POST',{})).status,403);
 assert.equal((await state(unrelated)).pendingCompletions.length,0);const other=await setup(false);assert.equal((await call(other,`/completions/${id}/approve`,'POST',{})).status,409);
 const results=await Promise.all([call(u,`/completions/${id}/approve`,'POST',{}),call(a,`/completions/${id}/approve`,'POST',{})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 s=(await call(a,'/state','GET',undefined,now,selected(kid))).body;assert.equal(s.user.stars,t.stars);assert.equal(s.household.weekCount,1);assert.equal(s.pendingCompletions.length,0);
 const e=(await call(a,'/history')).body.items.find((e:any)=>e.kind==='completion');assert.equal((await call(a,`/completions/${e.id}/undo`,'POST',{},now,selected(kid))).status,403);assert.equal((await call(a,`/completions/${e.id}/undo`,'POST',{})).status,200);assert.equal((await call(a,'/state','GET',undefined,now,selected(kid))).body.user.stars,0);
});
test('pending reports can be withdrawn or rejected; approval of an older round preserves the new round',async()=>{
 const u=await setup(false),kid=await child(u),t=await addTask(u,{approvalForChildren:true});const report=async(date=now)=>{const s=(await call(u,'/state','GET',undefined,date,selected(kid))).body;assert.equal((await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:s.tasks[0].occurrenceKey},date,selected(kid))).status,200);return (await call(u,'/state','GET',undefined,date,selected(kid))).body.pendingCompletions.at(-1).id;};
 let id=await report();assert.equal((await call(u,`/completions/${id}/withdraw`,'POST',{},now,selected(kid))).status,200);assert.equal((await state(u)).tasks[0].completion,null);
 id=await report();assert.equal((await call(u,`/completions/${id}/reject`,'POST',{})).status,200);assert.equal((await state(u)).household.weekCount,0);
 const old=await report(),later=new Date('2026-11-02T12:00:00Z'),fresh=await report(later);assert.equal((await call(u,`/completions/${old}/approve`,'POST',{},later)).status,200);
 let s=await state(u,later);assert.equal(s.tasks[0].completion.id,fresh);assert.equal(s.tasks[0].status,'pending');assert.equal(s.household.weekCount,1);
 assert.equal((await call(u,`/completions/${fresh}/approve`,'POST',{},later)).status,200);s=(await call(u,'/state','GET',undefined,later,selected(kid))).body;assert.equal(s.user.xp,2*t.xp);assert.equal(s.household.weekCount,2);
});
test('child removal cancels pending reports without granting points or leaving a locked mission',async()=>{
 const u=await setup(false),kid=await child(u),t=await addTask(u,{approvalForChildren:true});await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey},now,selected(kid));const id=(await state(u)).pendingCompletions[0].id;
 assert.equal((await call(u,`/members/${kid}`,'DELETE',{})).status,200);const s=await state(u);assert.equal(s.pendingCompletions.length,0);assert.equal(s.tasks[0].completion,null);assert.equal(s.household.weekCount,0);assert.equal((await call(u,`/completions/${id}/approve`,'POST',{})).status,409);
});
test('concurrent correction returns progress once, is isolated and permits a fresh completion',async()=>{
 const u=await setup(false),a=await join(u),other=await setup(false),t=await addTask(u);await complete(u,t);const e=(await call(u,'/history')).body.items.find((e:any)=>e.kind==='completion');
 assert.equal((await call(a,`/completions/${e.id}/undo`,'POST',{})).status,403);assert.equal((await call(other,`/completions/${e.id}/undo`,'POST',{})).status,404);
 const results=await Promise.all(Array.from({length:5},()=>call(u,`/completions/${e.id}/undo`,'POST',{})));assert.ok(results.every(r=>r.status===200));
 let s=await state(u);assert.equal(s.user.xp,0);assert.equal(s.user.stars,0);assert.equal(s.completedCount,0);assert.equal(s.household.weekCount,0);assert.equal(s.tasks[0].completion,null);
 const log=(await call(u,'/history')).body.items;assert.equal(log.filter((e:any)=>e.kind==='correction').length,1);assert.equal(log.find((x:any)=>x.id===e.id).reversed,true);assert.equal(s.recent.length,0);
 assert.equal((await complete(u,s.tasks[0])).status,200);assert.equal((await call(u,`/completions/${e.id}/undo`,'POST',{})).status,200);s=await state(u);assert.equal(s.user.xp,t.xp);assert.ok(s.tasks[0].completion);
});
test('undo of an old week never clears a newer completion or reduces the current weekly count',async()=>{
 const u=await setup(false),t=await addTask(u);await complete(u,t);const e=(await call(u,'/history')).body.items[0];const later=new Date('2026-11-02T12:00:00Z');await complete(u,(await state(u,later)).tasks[0],later);
 assert.equal((await call(u,`/completions/${e.id}/undo`,'POST',{},later)).status,200);const s=await state(u,later);assert.equal(s.user.xp,t.xp);assert.equal(s.completedCount,1);assert.equal(s.household.weekCount,1);assert.equal(s.tasks[0].status,'done');
});
test('correction and redemption stay consistent; spent stars can become debt without duplicating charges',async()=>{
 const u=await setup(false),t=await addTask(u);await complete(u,t);const e=(await call(u,'/history')).body.items[0],reward=(await call(u,'/rewards','POST',{title:'Eis',cost:120,icon:'ice'})).body;
 const results=await Promise.all([call(u,`/completions/${e.id}/undo`,'POST',{}),call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:crypto.randomUUID()})]);assert.equal(results[0].status,200);assert.ok([200,409].includes(results[1].status));
 let s=await state(u);assert.equal(s.user.stars,results[1].status===200?-120:0);assert.equal(s.redemptions.length,results[1].status===200?1:0);assert.equal((await call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:crypto.randomUUID()})).status,409);
 await complete(u,s.tasks[0]);const latest=(await call(u,'/history')).body.items.find((x:any)=>x.kind==='completion'&&!x.reversed);if(s.user.stars===0)await call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:crypto.randomUUID()});
 assert.equal((await call(u,`/completions/${latest.id}/undo`,'POST',{})).status,200);s=await state(u);assert.equal(s.user.stars,-120);assert.equal(s.redemptions.length,1);
});
test('schedule edits retain an already earned round and cannot award duplicate points',async()=>{
 const u=await setup(false),t=await addTask(u);await complete(u,t);assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',{...t,cadence:'weekly'})).status,200);const s=await state(u);assert.equal(s.tasks[0].status,'done');assert.equal((await complete(u,s.tasks[0])).status,409);assert.equal(s.user.xp,t.xp);
});
test('expired pauses do not accumulate missed rounds when replaced or manually resumed',async()=>{
 const u=await setup(false),t=await addTask(u,{cadence:'monthly',schedule:{startDate:'2026-10-01',monthDay:30}});await call(u,`/tasks/${t.id}/pause`,'POST',{from:'2026-10-29',until:'2026-11-03'});
 const later=new Date('2026-11-04T12:00:00Z');let s=await state(u,later);assert.equal(s.tasks[0].status,'upcoming');assert.equal(s.tasks[0].nextDueDate,'2026-11-30');
 await call(u,`/tasks/${t.id}/resume`,'POST',{},later);s=await state(u,later);assert.equal(s.tasks[0].status,'upcoming');assert.equal(s.tasks[0].nextDueDate,'2026-11-30');assert.equal((await complete(u,s.tasks[0],later)).status,409);
});
