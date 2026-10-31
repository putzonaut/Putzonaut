import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {digest} from '../server/domain.ts';
import {TASK_TEMPLATES} from '../shared/setup.ts';
import {templateDraft} from '../src/drafts.ts';
import {quickMissions} from '../shared/quick-start.ts';

const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-10-30T12:00:00Z');
let mf:Miniflare,repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});const db=await mf.getD1Database('DB');repo=new Repository(db);for(const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql).run();}});
after(async()=>{await mf.dispose();});
async function call(user:string|null,path:string,method='GET',body?:unknown,headers:Record<string,string>={}){const response=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})}),user?{userId:user}:null,repo,{now:()=>now});return {status:response.status,body:await response.json() as any};}
async function setup(){const id=crypto.randomUUID();assert.equal((await call(id,'/auth/setup','POST',{name:'Alex',householdName:'Sternencrew',taskTemplates:['dishes','trash','plant']})).status,201);await state(id);return id;}
async function state(user:string){const result=await call(user,'/state');assert.equal(result.status,200);return result.body;}
async function join(owner:string){const user=crypto.randomUUID(),invite=(await call(owner,'/invitations','POST',{})).body.token;assert.equal((await call(user,'/auth/join','POST',{name:'Robin',invite})).status,201);return user;}
async function complete(user:string,task:any,headers:Record<string,string>={}){return call(user,`/tasks/${task.id}/complete`,'POST',{occurrenceKey:task.occurrenceKey,checklistVersion:task.checklist.version},headers);}
async function backup(user:string){const r=await call(user,'/backups');assert.equal(r.status,200,JSON.stringify(r.body));return r.body;}
async function restore(user:string,file:any,headers:Record<string,string>={}){const p=await call(user,'/backups/preview','POST',{backup:file},headers);assert.equal(p.status,200,JSON.stringify(p.body));return call(user,'/backups/restore','POST',{backup:file,expectedRevision:p.body.expectedRevision,confirmation:'Sternencrew'},headers);}
async function rehash(file:any){const {checksum:_,...data}=file;return {...data,checksum:await digest(JSON.stringify(data))};}

test('crew backups include the entire log beyond the 50-item page and exclude identities and invitation secrets',async()=>{
 const u=await setup(),s=await state(u),invite=(await call(u,'/invitations','POST',{})).body.token;
 for(let i=0;i<57;i++){const e={id:crypto.randomUUID(),kind:'crew',userId:s.user.id,name:'Alex',title:'Historischer Eintrag '+i,createdAt:now.toISOString()};await repo.db.prepare('INSERT INTO events(id,household_id,member_id,kind,created_at,payload) VALUES(?,?,?,?,?,?)').bind(e.id,s.household.id,e.userId,e.kind,e.createdAt,JSON.stringify(e)).run();}
 const b=await backup(u);assert.equal(b.payload.history.length,57);assert.equal(b.payload.crew.tasks.length,3);assert.equal(JSON.stringify(b).includes(u),false);assert.equal(JSON.stringify(b).includes(invite.split('.')[1]),false);assert.equal('invites' in b.payload.crew,false);
 assert.equal((await call(u,'/backups/preview','POST',{backup:b})).status,200);
});
test('restoring replaces points/tasks/log atomically, revokes invitations, and creates a complete recoverable rollback point',async()=>{
 const u=await setup();let s=await state(u);const before=await backup(u);const event=await complete(u,s.tasks[0]);assert.equal(event.status,200);
 const invitation=(await call(u,'/invitations','POST',{})).body.token;
 const changed=await state(u);const result=await restore(u,before);assert.equal(result.status,200,JSON.stringify(result.body));
 s=await state(u);assert.equal(s.user.xp,0);assert.equal(s.tasks[0].status,'today');assert.equal(s.recent.length,0);assert.ok(s.restoreEpoch);assert.equal((await call(u,'/history')).body.items[0].kind,'restore');
 assert.equal((await call(crypto.randomUUID(),'/auth/join','POST',{name:'Late',invite:invitation})).status,410);
 const safety=await call(u,'/backups/recovery');assert.equal(safety.status,200);assert.equal(safety.body.payload.crew.members[0].xp,changed.user.xp);assert.equal(safety.body.payload.history.filter((e:any)=>e.kind==='completion').length,1);
 assert.equal((await restore(u,safety.body,{'X-Putzonaut-Epoch':s.restoreEpoch})).status,200);
 const recovered=await state(u);assert.equal(recovered.user.xp,changed.user.xp);assert.equal(recovered.tasks[0].status,'done');assert.equal(recovered.recent.length,1);
});
test('all backup routes reject non-captains, children and unauthenticated requests',async()=>{
 const u=await setup(),other=await join(u),child=(await call(u,'/children','POST',{name:'Mini'})).body.id,b=await backup(u);
 for(const path of ['/backups','/backups/status','/backups/recovery']){assert.equal((await call(other,path)).status,403);assert.equal((await call(u,path,'GET',undefined,{'X-Putzonaut-Profile':child})).status,403);assert.equal((await call(null,path)).status,401);}
 for(const path of ['/backups/preview','/backups/restore']){assert.equal((await call(other,path,'POST',{backup:b})).status,403);assert.equal((await call(u,path,'POST',{backup:b},{'X-Putzonaut-Profile':child})).status,403);}
});
test('foreign crew files, damaged checksums, invalid references, and old exports do not mutate data',async()=>{
 const a=await setup(),b=await setup(),file=await backup(a),original=await repo.forAccount(a);
 assert.equal((await call(b,'/backups/preview','POST',{backup:file})).status,409);
 const corrupt=structuredClone(file);corrupt.payload.crew.name='Changed';assert.equal((await call(a,'/backups/preview','POST',{backup:corrupt})).status,400);
 const invalid=structuredClone(file);invalid.payload.crew.tasks[0].assignedTo=crypto.randomUUID();assert.equal((await call(a,'/backups/preview','POST',{backup:await rehash(invalid)})).status,400);
 const old=(await call(a,'/export')).body;assert.equal((await call(a,'/backups/preview','POST',{backup:old})).status,400);
 assert.deepEqual(await repo.forAccount(a),original);
});
test('changed membership or role blocks restoration and cannot grant old access',async()=>{
 const u=await setup(),file=await backup(u);const other=await join(u);assert.equal((await call(u,'/backups/preview','POST',{backup:file})).status,409);
 const afterJoin=await backup(u),otherId=(await state(other)).user.id;assert.equal((await call(u,'/household/transfer','POST',{memberId:otherId})).status,200);
 assert.equal((await call(other,'/backups/preview','POST',{backup:afterJoin})).status,409);
 assert.equal((await call(u,'/backups/preview','POST',{backup:afterJoin})).status,403);
});
test('stale previews and wrong confirmations cannot erase newer changes',async()=>{
 const u=await setup(),file=await backup(u),preview=(await call(u,'/backups/preview','POST',{backup:file})).body;
 assert.equal((await call(u,'/backups/restore','POST',{backup:file,expectedRevision:preview.expectedRevision,confirmation:'wrong'})).status,400);
 await complete(u,(await state(u)).tasks[0]);const newer=await repo.forAccount(u);
 assert.equal((await call(u,'/backups/restore','POST',{backup:file,expectedRevision:preview.expectedRevision,confirmation:'Sternencrew'})).status,409);
 assert.deepEqual(await repo.forAccount(u),newer);assert.equal((await call(u,'/backups/status')).body.recoveryAt,null);
});
test('simultaneous restore attempts apply once and preserve the original safety snapshot',async()=>{
 const u=await setup(),file=await backup(u);await complete(u,(await state(u)).tasks[0]);const changed=await state(u),p=(await call(u,'/backups/preview','POST',{backup:file})).body;
 const results=await Promise.all([1,2].map(()=>call(u,'/backups/restore','POST',{backup:file,expectedRevision:p.expectedRevision,confirmation:'Sternencrew'})));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal((await call(u,'/backups/recovery')).body.payload.crew.members[0].xp,changed.user.xp);
});
test('restoration invalidates old client writes; refreshed clients can complete and correct normally',async()=>{
 const u=await setup(),old=await state(u),file=await backup(u);assert.equal((await restore(u,file)).status,200);
 assert.equal((await complete(u,old.tasks[0])).status,409);assert.equal((await call(u,'/profile','PATCH',{name:'Stale'})).status,409);
 const fresh=await state(u),headers={'X-Putzonaut-Epoch':fresh.restoreEpoch};assert.ok(fresh.tasks[0].checklist.version>old.tasks[0].checklist.version);
 const completion=await complete(u,fresh.tasks[0],headers);assert.equal(completion.status,200);
 assert.equal((await call(u,`/completions/${completion.body.id}/undo`,'POST',{},headers)).status,200);assert.equal((await state(u)).user.xp,0);
});
test('a request started before restoration cannot mutate its replacement after a concurrent retry',async()=>{
 const u=await setup(),old=await state(u),file=await backup(u);await restore(u,file);
 await assert.rejects(repo.mutate(u,now,h=>{h.name='Stale';return {result:null};},{householdId:old.household.id,memberId:old.user.id,restoreEpoch:old.restoreEpoch}));
 assert.equal((await state(u)).household.name,'Sternencrew');
});
test('restore preserves checklists, child approvals, quests, redemptions and former member history',async()=>{
 const u=await setup(),other=await join(u),child=(await call(u,'/children','POST',{name:'Mini'})).body.id;
 await complete(other,(await state(other)).tasks[2]);await call(other,'/household/leave','POST',{});
 const draft={...templateDraft('bedding'),approvalForChildren:true};const taskId=(await call(u,'/tasks','POST',draft)).body.id;
 let s=await state(u);await call(u,'/quests','POST',{weekKey:s.game.station.current.key,title:'Unsere Woche',taskIds:[s.tasks[0].id,s.tasks[1].id],repeat:true});
 const c={'X-Putzonaut-Profile':child};let task=(await call(u,'/state','GET',undefined,c)).body.tasks.find((t:any)=>t.id===taskId);
 for(const step of task.checklist.steps)assert.equal((await call(u,`/tasks/${taskId}/checklist`,'PATCH',{occurrenceKey:task.occurrenceKey,checklistVersion:task.checklist.version,stepId:step.id,done:true},c)).status,200);
 assert.equal((await complete(u,task,c)).status,200);
 s=await state(u);await complete(u,s.tasks[0]);const reward=(await call(u,'/rewards','POST',{title:'Eis',cost:5,icon:'ice'})).body.id;await call(u,`/rewards/${reward}/redeem`,'POST',{requestKey:crypto.randomUUID()});
 const file=await backup(u);assert.ok(file.payload.crew.pendingCompletions.length);assert.ok(file.payload.crew.members.some((m:any)=>m.removedAt));assert.equal(file.payload.crew.redemptions.length,1);
 await complete(u,(await state(u)).tasks[1]);assert.equal((await restore(u,file)).status,200);
 const restored=await state(u);assert.equal(restored.user.stars,file.payload.crew.members[0].stars);assert.equal(restored.pendingCompletions.length,1);assert.equal(restored.redemptions.length,1);assert.equal(await repo.forAccount(other),null);
 assert.equal((await call(u,`/completions/${restored.pendingCompletions[0].id}/approve`,'POST',{}, {'X-Putzonaut-Epoch':restored.restoreEpoch})).status,200);
});
test('all library templates can be added to a real crew without changing onboarding or granting points',async()=>{
 const u=await setup();for(const t of TASK_TEMPLATES){const r=await call(u,'/tasks','POST',templateDraft(t.key));assert.equal(r.status,200,t.title+': '+JSON.stringify(r.body));}
 const s=await state(u);assert.equal(s.tasks.length,TASK_TEMPLATES.length+3);assert.equal(s.user.xp,0);assert.equal(s.user.stars,0);assert.ok(quickMissions(s.tasks,s.user,5).length);
});

test('a database constraint failure rolls back the new state, history and safety snapshot together',async()=>{
 const u=await setup(),foreign=await setup();await complete(foreign,(await state(foreign)).tasks[0]);
 const file=await backup(u),foreignEvent=(await backup(foreign)).payload.history[0];
 file.payload.history.push({...foreignEvent,userId:file.payload.crew.members[0].id,name:'Alex'});
 const altered=await rehash(file),p=(await call(u,'/backups/preview','POST',{backup:altered})).body;
 const before=await repo.forAccount(u),otherBefore=await repo.forAccount(foreign);
 const result=await call(u,'/backups/restore','POST',{backup:altered,expectedRevision:p.expectedRevision,confirmation:'Sternencrew'});
 assert.equal(result.status,500);assert.deepEqual(await repo.forAccount(u),before);assert.deepEqual(await repo.forAccount(foreign),otherBefore);
 assert.equal((await call(u,'/backups/status')).body.recoveryAt,null);assert.equal((await call(u,'/history')).body.items.length,0);
});

test('multi-chunk history restores without missing entries and concurrent completions cannot be silently lost',async()=>{
 const u=await setup(),s=await state(u);const events=Array.from({length:430},(_,i)=>({id:crypto.randomUUID(),kind:'crew',userId:s.user.id,name:'Alex',title:'Langer Verlauf '+i,createdAt:now.toISOString()}));
 await repo.db.batch(events.map(e=>repo.db.prepare('INSERT INTO events(id,household_id,member_id,kind,created_at,payload) VALUES(?,?,?,?,?,?)').bind(e.id,s.household.id,e.userId,e.kind,e.createdAt,JSON.stringify(e))));
 const file=await backup(u),p=(await call(u,'/backups/preview','POST',{backup:file})).body;
 const [restored,completed]=await Promise.all([call(u,'/backups/restore','POST',{backup:file,expectedRevision:p.expectedRevision,confirmation:'Sternencrew'}),complete(u,s.tasks[0])]);
 assert.equal([restored,completed].filter(r=>r.status===200).length,1);
 assert.equal([restored,completed].filter(r=>r.status===409).length,1);
 const output=await backup(u);assert.equal(output.payload.history.length,431);
 if(completed.status===200)assert.equal((await state(u)).user.xp,s.tasks[0].xp);
 else {assert.equal((await state(u)).user.xp,0);assert.equal(output.payload.history.filter((e:any)=>e.kind==='restore').length,1);}
});
