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
async function complete(user:string,task:any,date=now){return call(user,`/tasks/${task.id}/complete`,'POST',{occurrenceKey:task.occurrenceKey,checklistVersion:task.checklist?.version},date);}
async function addTask(user:string,values:Record<string,unknown>={}){const result=await call(user,'/tasks','POST',{title:'Spezialmission',room:'Haushalt',icon:'sparkles',minutes:10,xp:100,stars:200,cadence:'daily',...values});assert.equal(result.status,200);return (await state(user)).tasks.find((t:any)=>t.id===result.body.id);}
test('real onboarding starts empty, persists across repository instances and hides account IDs',async()=>{const u=await setup();const s=await state(u);assert.equal(s.user.xp,0);assert.equal(s.user.stars,0);assert.equal(s.members.length,1);assert.equal(s.tasks.length,6);assert.equal(s.rewards.length,0);assert.equal(s.household.weekCount,0);assert.equal(JSON.stringify(s).includes(u),false);const another=new Repository(repo.db);assert.ok(await another.forAccount(u));const response=await call(u,'/state');assert.match(response.headers.get('Cache-Control')!,/no-store/);});
test('parallel setup produces a single household without orphaned rows',async()=>{const u=crypto.randomUUID();const before=await repo.db.prepare('SELECT count(*) AS n FROM households').first<{n:number}>();const results=await Promise.all([call(u,'/auth/setup','POST',{name:'Alex',householdName:'Crew A'}),call(u,'/auth/setup','POST',{name:'Alex',householdName:'Crew B'})]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);const after=await repo.db.prepare('SELECT count(*) AS n FROM households').first<{n:number}>();assert.equal(after!.n,before!.n+1);});
test('concurrent completion awards points and history exactly once',async()=>{const u=await setup();const t=(await state(u)).tasks[0];const results=await Promise.all(Array.from({length:8},()=>complete(u,t)));assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===409).length,7);const s=await state(u);assert.equal(s.user.xp,t.xp);assert.equal(s.user.stars,t.stars);assert.equal(s.household.weekCount,1);const history=await call(u,'/history');assert.equal(history.body.items.length,1);});
test('two members cannot consume the same invitation and member permissions are enforced',async()=>{const owner=await setup();const invite=(await call(owner,'/invitations','POST',{})).body.token;const users=[crypto.randomUUID(),crypto.randomUUID()];const joined=await Promise.all(users.map(u=>call(u,'/auth/join','POST',{name:'Crewmitglied',invite})));assert.deepEqual(joined.map(r=>r.status).sort(),[201,410]);const valid=users[joined.findIndex(r=>r.status===201)];assert.equal((await state(owner)).members.length,2);assert.equal((await call(valid,'/household','PATCH',{name:'Hijack',goalTitle:'Hijack',weekGoal:1})).status,403);assert.equal((await call(valid,'/export')).status,403);const expired=(await call(owner,'/invitations','POST',{})).body.token;assert.equal((await call(crypto.randomUUID(),'/auth/join','POST',{name:'Late',invite:expired},new Date('2026-11-07T12:00:00Z'))).status,410);});
test('households stay isolated and assignments cannot be bypassed',async()=>{const a=await setup();const b=await setup();const t=(await state(a)).tasks[0];assert.equal((await complete(b,t)).status,404);assert.equal((await state(b)).user.xp,0);const invitation=(await call(a,'/invitations','POST',{})).body.token;const m=crypto.randomUUID();assert.equal((await call(m,'/auth/join','POST',{name:'Member',invite:invitation})).status,201);const own=await state(a);const assigned=await addTask(a,{assignedTo:own.user.id});assert.equal((await complete(m,assigned)).status,403);assert.equal((await call(m,'/profile','PATCH',{name:'Changed',role:'admin',stars:9000})).status,200);assert.equal((await state(m)).user.role,'member');assert.equal((await state(m)).user.stars,0);});
test('competing redemptions cannot overdraw a balance, duplicate requests are idempotent',async()=>{const u=await setup(false);const t=await addTask(u);assert.equal((await complete(u,t)).status,200);const reward=(await call(u,'/rewards','POST',{title:'Filmabend',cost:120,icon:'film'})).body;const keys=[crypto.randomUUID(),crypto.randomUUID()];const results=await Promise.all(keys.map(key=>call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:key})));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const used=keys[results.findIndex(r=>r.status===200)];assert.equal((await call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:used})).status,200);const s=await state(u);assert.equal(s.user.stars,80);assert.equal(s.redemptions.length,1);});
test('concurrent retries with the same reward request charge only once',async()=>{const u=await setup(false);await complete(u,await addTask(u));const reward=(await call(u,'/rewards','POST',{title:'Eis essen',cost:100,icon:'ice'})).body;const key=crypto.randomUUID();const results=await Promise.all([call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:key}),call(u,`/rewards/${reward.id}/redeem`,'POST',{requestKey:key})]);assert.deepEqual(results.map(r=>r.status),[200,200]);assert.equal((await state(u)).user.stars,100);});
test('daily and weekly recurrence, stale requests, and Berlin calendar boundaries work',async()=>{assert.equal(localDay(new Date('2026-10-25T23:30:00Z')),'2026-10-26');assert.equal(weekKey(new Date('2027-01-01T12:00:00Z')),'2026-12-28');const u=await setup();let s=await state(u);await complete(u,s.tasks[0]);await complete(u,s.tasks[3]);const next=new Date('2026-10-30T12:00:00Z');const after=await state(u,next);assert.equal(after.tasks[0].completion,null);assert.ok(after.tasks[3].completion);assert.equal((await complete(u,s.tasks[0],next)).status,409);assert.equal((await complete(u,after.tasks[0],next)).status,200);const monday=await state(u,new Date('2026-11-02T12:00:00Z'));assert.equal(monday.household.weekCount,0);assert.equal(monday.user.xp,s.tasks[0].xp*2+s.tasks[3].xp);});
test('outfits enforce levels and funds, while equipped purchases remain unlocked',async()=>{const u=await setup(false);assert.equal((await call(u,'/outfits/comet/equip','POST',{})).status,409);const t=await addTask(u,{xp:1000,stars:500});await complete(u,t);assert.equal((await call(u,'/outfits/comet/equip','POST',{})).status,200);await call(u,'/outfits/starter/equip','POST',{});await call(u,'/outfits/comet/equip','POST',{});assert.equal((await state(u)).user.stars,150);assert.equal((await call(u,'/outfits/sun/equip','POST',{})).status,409);});
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

async function startQuest(u:string,tasks:any[],date=now,repeat=true){const s=await state(u,date);return call(u,'/quests','POST',{title:'Küche klar!',taskIds:tasks.map(t=>t.id),weekKey:s.game.station.current.key,repeat},date);}
async function rewardFor(u:string,cost=150){return (await call(u,'/rewards','POST',{title:'Wunschessen',cost,icon:'meal'})).body;}

test('station migration is durable and read-idempotent without changing existing balances',async()=>{
 const u=await setup(false);const before=(await repo.forAccount(u))!;const legacy=JSON.parse(before.document);delete legacy.game;legacy.members[0].weekCount=24;legacy.members[0].completedCount=24;legacy.members[0].stars=500;legacy.members[0].xp=960;
 await repo.db.prepare('UPDATE households SET document=? WHERE id=?').bind(JSON.stringify(legacy),before.id).run();const s=await state(u);assert.equal(s.game.station.wins,1);assert.equal(s.user.stars,500);assert.equal(s.user.xp,960);
 const after=(await repo.forAccount(u))!;assert.ok(JSON.parse(after.document).game);await state(u);assert.equal((await repo.forAccount(u))!.revision,after.revision);assert.equal(JSON.stringify(s).includes(u),false);
});
test('station earns one upgrade per successful week, freezes targets and corrects historical wins',async()=>{
 const u=await setup(false),t=await addTask(u);assert.equal((await call(u,'/household','PATCH',{name:'Sternencrew',goalTitle:'Filmabend',weekGoal:1})).status,200);
 let s=await state(u);assert.equal(s.household.weekGoal,24);assert.equal(s.household.nextWeekGoal,1);await complete(u,s.tasks[0]);assert.equal((await state(u)).game.station.wins,0);
 const dates=['2026-11-02','2026-11-09','2026-11-16'].map(day=>new Date(day+'T12:00:00Z'));let first='';
 for(let i=0;i<dates.length;i++){s=await state(u,dates[i]);assert.equal(s.household.weekGoal,1);assert.equal((await complete(u,s.tasks[0],dates[i])).status,200);s=await state(u,dates[i]);assert.equal(s.game.station.wins,i+1);assert.equal(s.game.station.stage,i+1);if(i===0)first=s.tasks[0].completion.id;}
 const later=dates[2];assert.equal((await call(u,`/completions/${first}/undo`,'POST',{},later)).status,200);s=await state(u,later);assert.equal(s.game.station.wins,2);assert.equal(s.household.weekCount,1);assert.equal(s.tasks[0].status,'done');
 assert.equal((await call(u,`/completions/${first}/undo`,'POST',{},later)).status,200);assert.equal((await state(u,later)).game.station.wins,2);
});
test('weekly quests validate role, household, date, unique tasks and this-week availability',async()=>{
 const u=await setup(false),a=await join(u),kid=await child(u),other=await setup(false);const t=await addTask(u),foreign=await addTask(other),future=await addTask(u,{cadence:'once',dueDate:'2027-03-01'});const body={title:'Quest',weekKey:weekKey(now),taskIds:[t.id]};
 assert.equal((await call(a,'/quests','POST',body)).status,403);assert.equal((await call(u,'/quests','POST',body,now,selected(kid))).status,403);
 for(const taskIds of [[],[t.id,t.id],[foreign.id],[future.id]])assert.ok([400,404].includes((await call(u,'/quests','POST',{...body,taskIds})).status));
 assert.equal((await call(u,'/quests','POST',{...body,weekKey:'2026-10-19'})).status,409);
 await call(u,`/tasks/${t.id}/pause`,'POST',{from:'2026-10-29',until:null});assert.equal((await startQuest(u,[t])).status,400);
});
test('parallel contributions award one quest bonus per contributor and never extra XP or goal counts',async()=>{
 const u=await setup(false),a=await join(u),t1=await addTask(u),t2=await addTask(u,{title:'Andere Mission'});assert.equal((await startQuest(u,[t1,t2])).status,200);
 const r=await Promise.all([complete(u,t1),complete(a,t2)]);assert.ok(r.every(x=>x.status===200));let s=await state(u),sa=await state(a);
 assert.equal(s.user.stars,t1.stars+20);assert.equal(sa.user.stars,t2.stars+20);assert.equal(s.user.xp,t1.xp);assert.equal(s.household.weekCount,2);assert.equal(s.game.quest.doneIds.length,2);assert.equal(s.game.quest.everRewarded,true);
 const bonuses=(await call(u,'/history')).body.items.flatMap((e:any)=>e.bonusChanges??[]);assert.equal(bonuses.length,2);assert.equal(bonuses.reduce((n:number,b:any)=>n+b.stars,0),40);
 assert.equal((await startQuest(u,[t1])).status,409);const later=new Date('2026-10-30T12:00:00Z');await complete(u,(await state(u,later)).tasks.find((t:any)=>t.id===t1.id),later);assert.equal((await state(u,later)).user.stars,t1.stars*2+20);
});
test('pending children contribute only after approval; their bonus and station contribution are reversible',async()=>{
 const u=await setup(false),kid=await child(u),t=await addTask(u,{approvalForChildren:true});await startQuest(u,[t]);await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey},now,selected(kid));
 let s=await state(u);assert.equal(s.game.quest.doneIds.length,0);assert.equal(s.game.station.current.count,0);const id=s.pendingCompletions[0].id;
 await call(u,`/completions/${id}/approve`,'POST',{});let ks=(await call(u,'/state','GET',undefined,now,selected(kid))).body;assert.equal(ks.user.stars,t.stars+20);assert.equal(ks.game.station.current.count,1);
 const e=(await call(u,'/history')).body.items.find((e:any)=>e.kind==='completion');await call(u,`/completions/${e.id}/undo`,'POST',{});ks=(await call(u,'/state','GET',undefined,now,selected(kid))).body;assert.equal(ks.user.stars,0);assert.equal(ks.game.quest.doneIds.length,0);
});
test('undo removes all bonuses if the quest is incomplete, then restoration nets only one bonus',async()=>{
 const u=await setup(false),a=await join(u),t1=await addTask(u),t2=await addTask(u);await startQuest(u,[t1,t2]);await complete(u,t1);await complete(a,t2);
 const original=(await state(u)).tasks.find((t:any)=>t.id===t2.id).completion.id;
 const undo=await Promise.all([call(u,`/completions/${original}/undo`,'POST',{}),call(a,`/completions/${original}/undo`,'POST',{})]);assert.ok(undo.every(x=>x.status===200));assert.equal((await state(u)).user.stars,t1.stars);assert.equal((await state(a)).user.stars,0);
 assert.equal((await startQuest(u,[t1])).status,409);await complete(a,(await state(a)).tasks.find((t:any)=>t.id===t2.id));assert.equal((await state(u)).user.stars,t1.stars+20);assert.equal((await state(a)).user.stars,t2.stars+20);
});
test('a remaining proof keeps the quest complete while only the no-longer-contributing profile loses its bonus',async()=>{
 const u=await setup(false),a=await join(u),t=await addTask(u);await startQuest(u,[t]);await complete(u,t);const original=(await state(u)).tasks[0].completion.id;
 const later=new Date('2026-10-30T12:00:00Z');await complete(a,(await state(a,later)).tasks[0],later);await call(u,`/completions/${original}/undo`,'POST',{},later);
 const s=await state(u,later);assert.equal(s.game.quest.doneIds.length,1);assert.equal(s.user.stars,0);assert.equal((await state(a,later)).user.stars,t.stars+20);
});
test('late approval belongs to the approval week, and old-week corrections do not change new quest credits',async()=>{
 const u=await setup(false),kid=await child(u),t=await addTask(u,{approvalForChildren:true});await startQuest(u,[t]);await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey},now,selected(kid));const pending=(await state(u)).pendingCompletions[0].id;
 const next=new Date('2026-11-02T12:00:00Z');await call(u,`/completions/${pending}/approve`,'POST',{},next);let s=(await call(u,'/state','GET',undefined,next,selected(kid))).body;assert.equal(s.user.stars,t.stars+20);assert.equal(s.game.quest.weekKey,'2026-11-02');assert.equal(s.household.weekCount,1);
 const event=(await call(u,'/history')).body.items.find((e:any)=>e.kind==='completion');const next2=new Date('2026-11-09T12:00:00Z');await complete(u,(await state(u,next2)).tasks[0],next2);await call(u,`/completions/${event.id}/undo`,'POST',{},next2);
 s=await state(u,next2);assert.equal(s.user.stars,t.stars+20);assert.equal(s.game.quest.doneIds.length,1);assert.equal(s.household.weekCount,1);assert.equal((await call(u,'/state','GET',undefined,next2,selected(kid))).body.user.stars,0);
});
test('automatic next-week quests omit archived and fully paused tasks and can be switched off',async()=>{
 const u=await setup(false),t1=await addTask(u),t2=await addTask(u),t3=await addTask(u);await startQuest(u,[t1,t2,t3]);
 await call(u,`/tasks/${t2.id}`,'DELETE',{});await call(u,`/tasks/${t3.id}/pause`,'POST',{from:'2026-11-02',until:'2026-11-08'});
 const next=new Date('2026-11-02T12:00:00Z');const s=await state(u,next);assert.deepEqual(s.game.quest.tasks.map((t:any)=>t.id),[t1.id]);assert.equal(s.game.quest.doneIds.length,0);
 await call(u,'/quests/repeat','PATCH',{enabled:false},next);assert.equal((await state(u,new Date('2026-11-09T12:00:00Z'))).game.quest,null);
});
test('quest setup counts current-week proofs once, including racing setup and completion',async()=>{
 const u=await setup(false),t=await addTask(u);await complete(u,t);const body={title:'Retro',weekKey:weekKey(now),taskIds:[t.id],repeat:false};const rs=await Promise.all([call(u,'/quests','POST',body),call(u,'/quests','POST',body)]);assert.deepEqual(rs.map(r=>r.status).sort(),[200,409]);assert.equal((await state(u)).user.stars,t.stars+20);
});
test('savings targets use the current balance, remain isolated and update when a wish changes',async()=>{
 const u=await setup(false),a=await join(u),kid=await child(u),other=await setup(false),r=await rewardFor(u),foreign=await rewardFor(other);const t=await addTask(u,{stars:40});await complete(u,t);
 assert.equal((await call(u,'/profile/goal','PATCH',{rewardId:foreign.id})).status,404);assert.equal((await call(u,'/profile/goal','PATCH',{rewardId:r.id})).status,200);
 let s=await state(u);assert.equal(s.game.savingGoal.remaining,110);assert.equal(s.game.savingGoal.saved,40);assert.equal((await state(a)).game.savingGoal,null);
 await call(u,'/profile/goal','PATCH',{rewardId:r.id},now,selected(kid));assert.equal((await call(u,'/state','GET',undefined,now,selected(kid))).body.game.savingGoal.saved,0);
 await call(u,`/rewards/${r.id}`,'PATCH',{title:'Neuer Wunsch',cost:30,icon:'gift'});s=await state(u);assert.equal(s.game.savingGoal.ready,true);assert.equal(s.game.savingGoal.title,'Neuer Wunsch');assert.equal(s.game.savingGoal.saved,30);
 await call(u,`/rewards/${r.id}/redeem`,'POST',{requestKey:crypto.randomUUID()});assert.equal((await state(u)).game.savingGoal,null);assert.equal((await call(u,'/state','GET',undefined,now,selected(kid))).body.game.savingGoal.id,r.id);
 await call(u,`/rewards/${r.id}`,'DELETE',{});assert.equal((await call(u,'/state','GET',undefined,now,selected(kid))).body.game.savingGoal,null);
});
test('quest correction with already spent stars preserves redemptions and shows the full saving gap',async()=>{
 const u=await setup(false),t=await addTask(u,{stars:10});await startQuest(u,[t]);await complete(u,t);const r=await rewardFor(u,25);await call(u,`/rewards/${r.id}/redeem`,'POST',{requestKey:crypto.randomUUID()});const e=(await call(u,'/history')).body.items.find((e:any)=>e.kind==='completion');await call(u,`/completions/${e.id}/undo`,'POST',{});
 await call(u,'/profile/goal','PATCH',{rewardId:r.id});const s=await state(u);assert.equal(s.user.stars,-25);assert.equal(s.redemptions.length,1);assert.equal(s.game.savingGoal.saved,0);assert.equal(s.game.savingGoal.remaining,50);assert.equal(s.game.savingGoal.ready,false);
});
test('new outfits and titles require real achievements; corrections retain cosmetics and fix task statistics',async()=>{
 const u=await setup(false),t=await addTask(u,{icon:'plant',room:'Küche'});assert.equal((await call(u,'/outfits/garden/equip','POST',{})).status,403);assert.equal((await call(u,'/profile/game','PATCH',{personalGoal:2,titleId:'garden',patchId:'garden'})).status,403);
 for(let i=0;i<6;i++){const d=new Date(`2026-11-0${i+1}T12:00:00Z`);await complete(u,(await state(u,d)).tasks[0],d);}
 const date=new Date('2026-11-06T12:00:00Z');let s=await state(u,date);assert.equal(s.game.achievements.find((a:any)=>a.id==='garden').unlocked,true);assert.equal(s.outfits.find((o:any)=>o.id==='garden').unlocked,true);
 assert.equal((await call(u,'/outfits/garden/equip','POST',{},date)).status,200);assert.equal((await call(u,'/profile/game','PATCH',{personalGoal:4,titleId:'garden',patchId:'garden'},date)).status,200);s=await state(u,date);assert.equal(s.user.title,'Gartenpilot');assert.equal(s.user.patch,'leaf');assert.equal(s.game.personalGoal.target,4);
 const last=s.tasks[0].completion.id;await call(u,`/tasks/${t.id}`,'PATCH',{...s.tasks[0],icon:'trash',room:'Bad'},date);await call(u,`/completions/${last}/undo`,'POST',{},date);s=await state(u,date);assert.equal(s.game.achievements.find((a:any)=>a.id==='garden').value,5);assert.equal(s.game.achievements.find((a:any)=>a.id==='kitchen').value,0);assert.equal(s.outfits.find((o:any)=>o.id==='garden').unlocked,true);assert.equal(s.user.outfit,'garden');
});
test('historical mission counts unlock the new nebula suit without altering XP or spent stars',async()=>{
 const u=await setup(false);await repo.mutate(u,now,h=>{h.members[0].completedCount=30;h.members[0].xp=1000;h.members[0].stars=7;return {result:null};});const s=await state(u);assert.equal(s.outfits.find((o:any)=>o.id==='nebula').unlocked,true);assert.equal(s.user.stars,7);assert.equal((await call(u,'/outfits/nebula/equip','POST',{})).status,200);assert.equal((await state(u)).user.stars,7);
});
test('personal goals and styling apply only to the selected authorized profile and enforce limits',async()=>{
 const u=await setup(false),kid=await child(u),other=await join(u);const body={personalGoal:1,titleId:null,patchId:null};assert.equal((await call(u,'/profile/game','PATCH',body,now,selected(kid))).status,200);assert.equal((await call(u,'/state','GET',undefined,now,selected(kid))).body.game.personalGoal.target,1);assert.equal((await state(u)).game.personalGoal.target,3);
 assert.equal((await call(other,'/profile/game','PATCH',body,now,selected(kid))).status,403);for(const n of [0,31,2.5])assert.equal((await call(u,'/profile/game','PATCH',{...body,personalGoal:n})).status,400);assert.equal((await call(u,'/profile/game','PATCH',{...body,titleId:'admin'})).status,403);assert.equal((await state(u)).user.stars,0);
});
test('version 0.5 export includes game progress and savings without exposing identity or invitation secrets',async()=>{
 const u=await setup(false),r=await rewardFor(u),t=await addTask(u);await startQuest(u,[t]);await complete(u,t);await call(u,'/profile/goal','PATCH',{rewardId:r.id});const invite=(await call(u,'/invitations','POST',{})).body.token;const ex=(await call(u,'/export')).body;assert.equal(ex.version,5);assert.ok(ex.game.weeks[weekKey(now)].quest.everRewarded);assert.equal(ex.members[0].savingRewardId,r.id);assert.equal(JSON.stringify(ex).includes(u),false);assert.equal(JSON.stringify(ex).includes(invite.split('.')[1]),false);
});

test('quest options include partial-week availability but exclude old completed interval rounds',async()=>{
 const u=await setup(false),partial=await addTask(u),monthly=await addTask(u,{cadence:'monthly',schedule:{startDate:'2026-10-01',monthDay:28}}),interval=await addTask(u,{cadence:'interval',schedule:{startDate:'2026-10-29',intervalWeeks:4}});
 await complete(u,monthly);await complete(u,interval);
 await call(u,`/tasks/${partial.id}/pause`,'POST',{from:'2026-10-30',until:'2026-11-08'});
 const current=(await state(u)).game.questOptions.map((t:any)=>t.id);assert.ok(current.includes(partial.id));assert.ok(current.includes(monthly.id));assert.ok(current.includes(interval.id));
 const later=new Date('2026-11-02T12:00:00Z');const next=(await state(u,later)).game.questOptions.map((t:any)=>t.id);assert.equal(next.includes(partial.id),false);assert.equal(next.includes(monthly.id),false);assert.equal(next.includes(interval.id),false);
 assert.equal((await startQuest(u,[monthly],later)).status,400);
});

async function markStep(u:string,t:any,index:number,done=true,date=now,headers:Record<string,string>={}){return call(u,`/tasks/${t.id}/checklist`,'PATCH',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version,stepId:t.steps[index].id,done},date,headers);}
async function taskState(u:string,id:string,date=now,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,date,headers);assert.equal(r.status,200);return r.body.tasks.find((t:any)=>t.id===id);}
async function createArea(u:string,name='Balkon'){const r=await call(u,'/areas','POST',{name,icon:'sun'});assert.equal(r.status,200);return r.body.id;}

test('0.5 documents gain durable default areas once without resetting earned progress',async()=>{
 const u=await setup(),t=(await state(u)).tasks[0];await complete(u,t);const row=(await repo.forAccount(u))!,h=JSON.parse(row.document);delete h.areas;for(const task of h.tasks)delete task.areaId;
 await repo.db.prepare('UPDATE households SET document=? WHERE id=?').bind(JSON.stringify(h),h.id).run();const s=await state(u);assert.equal(s.areas.length,4);assert.equal(s.tasks[0].areaId,'living');assert.equal(s.user.xp,t.xp);assert.equal(s.tasks[0].status,'done');assert.deepEqual(s.tasks[0].checklist.steps,[]);
 const revision=(await repo.forAccount(u))!.revision;await state(u);assert.equal((await repo.forAccount(u))!.revision,revision);assert.ok(JSON.parse((await repo.forAccount(u))!.document).areas);
});
test('areas enforce captain access, unique names, household isolation and standard protection',async()=>{
 const u=await setup(false),member=await join(u),kid=await child(u),other=await setup(false),foreign=await createArea(other);assert.equal((await call(member,'/areas','POST',{name:'Garten',icon:'leaf'})).status,403);assert.equal((await call(u,'/areas','POST',{name:'Garten',icon:'leaf'},now,selected(kid))).status,403);
 const area=await createArea(u);assert.equal((await call(u,'/areas','POST',{name:'  BALKON  ',icon:'leaf'})).status,409);assert.equal((await call(u,'/areas','POST',{name:'Küche',icon:'paw'})).status,409);
 assert.equal((await call(u,`/areas/${foreign}`,'PATCH',{name:'Fremd',icon:'leaf'})).status,404);assert.equal((await call(u,'/areas/kitchen','DELETE',{})).status,409);assert.equal((await call(u,'/areas/kitchen','PATCH',{name:'Andere Küche',icon:'leaf'})).status,409);
 const payload={title:'Blumen pflegen',room:'Küche',areaId:foreign,icon:'plant',minutes:10,xp:40,stars:15,cadence:'daily'};assert.equal((await call(u,'/tasks','POST',payload)).status,400);
 assert.equal((await call(u,'/tasks','POST',{...payload,areaId:area})).status,200);const t=(await state(u)).tasks[0];assert.equal(t.room,'Balkon');assert.equal(t.roomIcon,'sun');
});
test('area rename updates current tasks while history stays unchanged; used areas cannot be removed',async()=>{
 const u=await setup(false),areaId=await createArea(u),t=await addTask(u,{areaId,room:'Balkon'});await complete(u,t);assert.equal((await call(u,`/areas/${areaId}`,'PATCH',{name:'Dachterrasse',icon:'leaf'})).status,200);
 assert.equal((await taskState(u,t.id)).room,'Dachterrasse');assert.equal((await call(u,'/history')).body.items[0].room,'Balkon');assert.equal((await call(u,`/areas/${areaId}`,'DELETE',{})).status,409);
 await call(u,`/tasks/${t.id}`,'DELETE',{});assert.equal((await call(u,`/areas/${areaId}`,'DELETE',{})).status,200);assert.equal((await state(u)).areas.length,4);assert.equal((await state(u)).user.stars,t.stars);
});
test('concurrent same-name area creation and the 24-area limit remain atomic',async()=>{
 const u=await setup(false);const results=await Promise.all([call(u,'/areas','POST',{name:'Garten',icon:'leaf'}),call(u,'/areas','POST',{name:'garten',icon:'leaf'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 for(let i=0;i<19;i++)await createArea(u,'Bereich '+i);assert.equal((await state(u)).areas.length,24);assert.equal((await call(u,'/areas','POST',{name:'Zu viel',icon:'home'})).status,409);
});
test('checklists reject invalid, duplicate and foreign step IDs and cap step counts',async()=>{
 const u=await setup(false),t=await addTask(u,{steps:[{title:'Spiegel'},{title:'Boden'}]});assert.equal(t.steps.length,2);assert.notEqual(t.steps[0].id,t.steps[1].id);
 assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',{...t,steps:Array.from({length:13},()=>({title:'Schritt'}))})).status,400);assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',{...t,steps:[{title:'   '}]})).status,400);
 assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',{...t,steps:[t.steps[0],t.steps[0]]})).status,400);assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',{...t,steps:[{id:crypto.randomUUID(),title:'Fremd'}]})).status,400);
 assert.equal((await call(u,'/tasks','POST',{...t,title:'Kopie'})).status,400);assert.equal((await complete(u,t)).status,409);
});
test('concurrent checklist ticks merge without points, completion and quest bonus remain single awards',async()=>{
 const u=await setup(false),a=await join(u),t=await addTask(u,{steps:[{title:'Spiegel'},{title:'Boden'}]});await startQuest(u,[t]);const rs=await Promise.all([markStep(u,t,0),markStep(a,t,1),markStep(u,t,0)]);assert.ok(rs.every(r=>r.status===200));
 let s=await state(u);assert.equal(s.user.stars,0);assert.equal(s.household.weekCount,0);assert.equal((await call(u,'/history')).body.items.filter((e:any)=>e.kind==='completion').length,0);assert.equal(s.tasks[0].checklist.doneIds.length,2);
 const done=await Promise.all([complete(u,s.tasks[0]),complete(a,s.tasks[0])]);assert.deepEqual(done.map(r=>r.status).sort(),[200,409]);s=await state(u);assert.equal(s.household.weekCount,1);assert.equal(s.members.reduce((n:number,m:any)=>n+m.stars,0),t.stars+20);assert.equal(s.members.reduce((n:number,m:any)=>n+m.xp,0),t.xp);
 assert.equal((await markStep(u,t,0,false)).status,409);
});
test('checklist writes enforce task assignment, selected child access, crew isolation and pauses',async()=>{
 const u=await setup(false),a=await join(u),b=await join(u),kid=await child(a),other=await setup(false);const t=await addTask(u,{assignedTo:kid,steps:[{title:'Aufräumen'}]});
 assert.equal((await markStep(b,t,0)).status,403);assert.equal((await markStep(b,t,0,true,now,selected(kid))).status,403);assert.equal((await markStep(other,t,0)).status,404);
 assert.equal((await markStep(a,t,0,true,now,selected(kid))).status,200);await call(u,`/tasks/${t.id}/pause`,'POST',{from:'2026-10-29',until:null});assert.equal((await markStep(u,t,0,false)).status,409);
 const future=await addTask(u,{cadence:'once',dueDate:'2027-01-01',steps:[{title:'Später'}]});assert.equal((await markStep(u,future,0)).status,409);
});
test('daily checklist resets on the next round and refuses stale or fabricated progress',async()=>{
 const u=await setup(false),t=await addTask(u,{steps:[{title:'Spiegel'}]});await markStep(u,t,0);await complete(u,t);const tomorrow=new Date('2026-10-30T12:00:00Z');const next=await taskState(u,t.id,tomorrow);
 assert.deepEqual(next.checklist.doneIds,[]);assert.equal((await markStep(u,t,0,true,tomorrow)).status,409);assert.equal((await complete(u,next,tomorrow)).status,409);
 assert.equal((await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:next.occurrenceKey,checklistVersion:next.checklist.version,checklist:{doneIds:[t.steps[0].id]},stepsDone:true},tomorrow)).status,409);
 await markStep(u,next,0,true,tomorrow);assert.equal((await complete(u,next,tomorrow)).status,200);assert.equal((await state(u,tomorrow)).user.stars,t.stars*2);
});
test('step edits retain only unchanged checks and reject writes from an older checklist version',async()=>{
 const u=await setup(false),t=await addTask(u,{steps:[{title:'Spiegel'},{title:'Boden'},{title:'Tür'}]});for(let i=0;i<3;i++)await markStep(u,t,i);
 const edited={...t,steps:[t.steps[0],{...t.steps[1],title:'Boden wischen'},{title:'Regal'}]};assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',edited)).status,200);let next=await taskState(u,t.id);assert.deepEqual(next.checklist.doneIds,[t.steps[0].id]);assert.equal((await markStep(u,t,1)).status,409);assert.equal((await complete(u,t)).status,409);
 const {steps,...legacy}=next;await call(u,`/tasks/${t.id}`,'PATCH',{...legacy,title:'Neuer Name'});next=await taskState(u,t.id);assert.equal(next.steps.length,3);assert.deepEqual(next.checklist.doneIds,[t.steps[0].id]);
 await call(u,`/tasks/${t.id}`,'PATCH',{...next,cadence:'weekly'});next=await taskState(u,t.id);assert.deepEqual(next.checklist.doneIds,[]);
});
test('completion returns a direct undo handle; undo resets this checklist and invalidates delayed ticks',async()=>{
 const u=await setup(false),t=await addTask(u,{steps:[{title:'Spiegel'}]});await markStep(u,t,0);const done=await complete(u,t);assert.equal(done.status,200);assert.equal(done.body.canUndo,true);assert.ok(done.body.id);assert.equal(done.body.createdAt,now.toISOString());
 const undone=await Promise.all([call(u,`/completions/${done.body.id}/undo`,'POST',{}),call(u,`/completions/${done.body.id}/undo`,'POST',{})]);assert.ok(undone.every(r=>r.status===200));const next=await taskState(u,t.id);assert.deepEqual(next.checklist.doneIds,[]);assert.equal((await markStep(u,t,0)).status,409);assert.equal((await state(u)).user.stars,0);
 await markStep(u,next,0);assert.equal((await complete(u,next)).status,200);assert.equal((await state(u)).user.stars,t.stars);
});
test('undo of an older round preserves newer checklist progress',async()=>{
 const u=await setup(false),t=await addTask(u,{steps:[{title:'Spiegel'},{title:'Boden'}]});await markStep(u,t,0);await markStep(u,t,1);const done=await complete(u,t);const later=new Date('2026-11-02T12:00:00Z');const next=await taskState(u,t.id,later);await markStep(u,next,0,true,later);
 await call(u,`/completions/${done.body.id}/undo`,'POST',{},later);const after=await taskState(u,t.id,later);assert.deepEqual(after.checklist.doneIds,[t.steps[0].id]);assert.equal(after.checklist.version,next.checklist.version);assert.equal((await state(u,later)).household.weekCount,0);
});
test('child approval uses its submitted checklist snapshot even after the task changes',async()=>{
 const u=await setup(false),kid=await child(u),t=await addTask(u,{steps:[{title:'Spiegel'}],approvalForChildren:true});await startQuest(u,[t]);await markStep(u,t,0,true,now,selected(kid));
 const submitted=await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version},now,selected(kid));assert.equal(submitted.body.canUndo,false);const claim=(await state(u)).pendingCompletions[0];assert.equal(claim.steps[0].title,'Spiegel');assert.equal((await state(u)).household.weekCount,0);
 await call(u,`/tasks/${t.id}`,'PATCH',{...t,steps:[{title:'Neue Aufgabe'}],xp:10,stars:5});assert.equal((await taskState(u,t.id)).checklist.steps[0].title,'Spiegel');
 assert.equal((await call(u,`/completions/${claim.id}/approve`,'POST',{})).status,200);const s=(await call(u,'/state','GET',undefined,now,selected(kid))).body;assert.equal(s.user.xp,t.xp);assert.equal(s.user.stars,t.stars+20);assert.equal(s.tasks[0].checklist.steps[0].title,'Spiegel');
 const event=(await call(u,'/history')).body.items.find((e:any)=>e.kind==='completion');assert.equal(event.steps[0].title,'Spiegel');await call(u,`/completions/${event.id}/undo`,'POST',{});const reset=await taskState(u,t.id);assert.equal(reset.checklist.steps[0].title,'Neue Aufgabe');assert.deepEqual(reset.checklist.doneIds,[]);
});
test('rejected child reports reset current checklists but preserve a later round',async()=>{
 const u=await setup(false),kid=await child(u),t=await addTask(u,{steps:[{title:'Aufräumen'}],approvalForChildren:true});await markStep(u,t,0,true,now,selected(kid));await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version},now,selected(kid));let claim=(await state(u)).pendingCompletions[0];await call(u,`/completions/${claim.id}/reject`,'POST',{});let current=await taskState(u,t.id);assert.deepEqual(current.checklist.doneIds,[]);
 await markStep(u,current,0,true,now,selected(kid));await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:current.occurrenceKey,checklistVersion:current.checklist.version},now,selected(kid));claim=(await state(u)).pendingCompletions[0];const later=new Date('2026-10-30T12:00:00Z');current=await taskState(u,t.id,later);await markStep(u,current,0,true,later);await call(u,`/completions/${claim.id}/withdraw`,'POST',{},later,selected(kid));assert.deepEqual((await taskState(u,t.id,later)).checklist.doneIds,[t.steps[0].id]);
});
test('removing a child cancels its pending checklist and prevents stale progress restoration',async()=>{
 const u=await setup(false),kid=await child(u),t=await addTask(u,{steps:[{title:'Aufräumen'}],approvalForChildren:true,assignedTo:kid});await markStep(u,t,0,true,now,selected(kid));await call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version},now,selected(kid));
 await call(u,`/members/${kid}`,'DELETE',{});const current=await taskState(u,t.id);assert.deepEqual(current.checklist.doneIds,[]);assert.equal(current.effectiveAssignedTo,null);assert.equal((await markStep(u,t,0)).status,409);assert.equal((await state(u)).user.stars,0);
});
test('final checklist tick racing completion never bypasses remaining work or double-credits',async()=>{
 const u=await setup(false),t=await addTask(u,{steps:[{title:'Ein letzter Schritt'}]});const [tick,done]=await Promise.all([markStep(u,t,0),complete(u,t)]);assert.equal(tick.status,200);assert.ok([200,409].includes(done.status));if(done.status===409)assert.equal((await complete(u,await taskState(u,t.id))).status,200);
 assert.equal((await state(u)).user.xp,t.xp);assert.equal((await call(u,'/history')).body.items.filter((e:any)=>e.kind==='completion').length,1);
});
test('the seven-day state exposes future rotation and never allows future completion',async()=>{
 const u=await setup(false),a=await join(u);const s=await state(u),aId=(await state(a)).user.id;const t=await addTask(u,{rotationIds:[s.user.id,aId]});const plan=(await state(u)).planner;assert.equal(plan.days.length,7);assert.equal(plan.from,'2026-10-29');assert.equal(plan.through,'2026-11-04');const monday=plan.days.find((d:any)=>d.date==='2026-11-02').rounds[0];assert.equal(monday.assignedTo,aId);assert.equal(monday.availableNow,false);assert.equal((await call(a,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:monday.occurrenceKey})).status,403);
});
test('0.6 journey: setup, invitation, custom area, checklist, quest, saving goal, redemption and export',async()=>{
 const u=await setup(false),a=await join(u),areaId=await createArea(u,'Kinderzimmer');const t=await addTask(u,{areaId,room:'Kinderzimmer',steps:[{title:'Bücher ins Regal'},{title:'Boden freiräumen'}],stars:30});await startQuest(u,[t]);const reward=await rewardFor(u,40);await call(a,'/profile/goal','PATCH',{rewardId:reward.id});await markStep(a,t,0);await markStep(a,t,1);assert.equal((await complete(a,await taskState(a,t.id))).status,200);let s=await state(a);assert.equal(s.game.savingGoal.ready,true);assert.equal(s.user.stars,50);
 assert.equal((await call(a,`/rewards/${reward.id}/redeem`,'POST',{requestKey:crypto.randomUUID()})).status,200);s=await state(a);assert.equal(s.user.stars,10);assert.equal(s.game.savingGoal,null);const ex=(await call(u,'/export')).body;assert.equal(ex.version,5);assert.equal(ex.areas.find((x:any)=>x.id===areaId).name,'Kinderzimmer');assert.equal(ex.tasks[0].steps.length,2);assert.equal(JSON.stringify(ex).includes(a),false);assert.equal((await call(a,'/export')).status,403);
});
