import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {suggestedPoints} from '../shared/game.ts';
import {parseBackup} from '../server/backup-schema.ts';
import {TASK_ICON_IDS,TASK_ICON_CATEGORIES} from '../shared/task-icons.ts';
import {evidenceCategory} from '../shared/categories.ts';

const origin='https://putzonaut-test.denny-subke.chatgpt.site',initial='2026-10-29';
let mf:Miniflare,repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});const db=await mf.getD1Database('DB');repo=new Repository(db);for(const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())for(const statement of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(statement.trim())await db.prepare(statement).run();});
after(async()=>{await mf.dispose();});
async function call(user:string,path:string,method='GET',body?:unknown,day=initial,profile?:string){const response=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(profile?{'X-Putzonaut-Profile':profile}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),{userId:user},repo,{now:()=>new Date(day+'T12:00:00Z')});return {status:response.status,body:await response.json() as any};}
async function setup(){const user=crypto.randomUUID();assert.equal((await call(user,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false})).status,201);return user;}
async function state(user:string,day=initial,profile?:string){const r=await call(user,'/state','GET',undefined,day,profile);assert.equal(r.status,200);return r.body;}
async function join(owner:string){const user=crypto.randomUUID(),invite=(await call(owner,'/invitations','POST',{})).body.token;assert.equal((await call(user,'/auth/join','POST',{name:'Robin',invite})).status,201);return user;}
async function task(owner:string,values:Record<string,unknown>={}){const r=await call(owner,'/tasks','POST',{title:'Boden wischen',room:'Haushalt',icon:'sparkles',minutes:10,xp:40,stars:15,cadence:'daily',...values});assert.equal(r.status,200);return (await state(owner)).tasks.find((t:any)=>t.id===r.body.id);}
const record=()=>({requestKey:crypto.randomUUID(),title:'Schublade auswischen',minutes:10,difficulty:'normal',areaId:'household'});
const defer=(t:any,until:string)=>({occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0,until});
const complete=(u:string,t:any,day=initial,profile?:string)=>call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0,checklistVersion:t.checklist.version,requestKey:crypto.randomUUID()},day,profile);

test('every mission symbol persists through creation, editing, completion and a real exported backup',async()=>{
 const u=await setup();
 for(const icon of TASK_ICON_IDS){const t=await task(u,{title:'Symbol '+icon,icon});assert.equal(t.icon,icon);assert.equal(t.category,TASK_ICON_CATEGORIES[icon]??'tidy');}
 const before=await state(u);assert.equal(before.user.stars,0);
 const t=before.tasks[0];assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',{title:t.title,icon:'pets',category:'household',room:'Haushalt',minutes:10,xp:40,stars:15,cadence:'daily'})).status,200);
 const updated=(await state(u)).tasks.find((x:any)=>x.id===t.id);assert.equal(updated.icon,'pets');assert.equal(updated.category,'household');assert.equal((await complete(u,updated)).status,200);
 const backup=await call(u,'/backups');assert.equal(backup.status,200);const restored=await parseBackup(backup.body);assert.deepEqual(restored.payload.crew.tasks.map(t=>t.icon),['pets',...TASK_ICON_IDS.slice(1)]);
 assert.equal((await call(u,'/tasks','POST',{title:'Unbekanntes Symbol',icon:'missing',room:'Haushalt',minutes:10,xp:40,stars:15,cadence:'daily'})).status,400);
 assert.equal(evidenceCategory({icon:'__proto__',room:'Unbekannt'}),undefined);assert.equal(evidenceCategory({icon:'constructor'}),undefined);
});

test('spontaneous records create one completed one-off, use standard points and are idempotent under concurrency',async()=>{
 const u=await setup(),body=record();const results=await Promise.all(Array.from({length:5},()=>call(u,'/tasks/record','POST',body)));
 assert.deepEqual(results.map(r=>r.status),[200,200,200,200,200]);const s=await state(u);assert.equal(s.tasks.length,1);assert.equal(s.tasks[0].cadence,'once');assert.equal(s.tasks[0].status,'done');assert.equal(s.user.completedCount,undefined);assert.equal(s.completedCount,1);assert.equal(s.user.xp,suggestedPoints(10).xp);assert.equal(s.user.stars,suggestedPoints(10).stars);
 const history=(await call(u,'/history')).body.items;assert.equal(history.filter((e:any)=>e.kind==='completion').length,1);assert.equal((await call(u,'/tasks/record','POST',{...body,title:'Anderer Titel'})).status,409);
 const receipt=results.find(r=>!r.body.replayed)!.body;assert.equal((await call(u,`/completions/${receipt.id}/undo`,'POST',{})).status,200);assert.equal((await state(u)).user.stars,0);assert.equal((await call(u,'/tasks/record','POST',body)).body.replayed,true);assert.equal((await state(u)).user.stars,0);
});
test('members may record only their own effort; values and account isolation remain server enforced',async()=>{
 const owner=await setup(),u=await join(owner),foreign=await setup();const s=await state(u),r=await call(u,'/tasks/record','POST',record());assert.equal(r.status,200);assert.equal((await state(u)).tasks[0].assignedTo,s.user.id);assert.equal((await state(owner)).user.stars,0);
 assert.equal((await call(u,'/tasks/record','POST',{...record(),stars:500})).status,400);assert.equal((await call(u,'/tasks/record','POST',{...record(),minutes:0})).status,400);assert.equal((await call(u,'/tasks/record','POST',{...record(),areaId:'foreign'})).status,400);
 assert.equal((await call(u,'/tasks/record','POST',record(),initial,(await state(foreign)).user.id)).status,403);
 await call(u,'/profile/away','PATCH',{from:initial,until:'2026-11-02'});assert.equal((await call(u,'/tasks/record','POST',record())).status,409);assert.equal((await state(u)).tasks.length,1);
});
test('spontaneous records cannot bypass an existing open mission and its checklist',async()=>{
 const u=await setup();await task(u,{title:'Schublade auswischen',steps:[{title:'Innen reinigen'}]});
 assert.equal((await call(u,'/tasks/record','POST',{...record(),title:' SCHUBLADE AUSWISCHEN '})).status,409);
 const s=await state(u);assert.equal(s.tasks.length,1);assert.equal(s.completedCount,0);assert.equal(s.user.stars,0);
});
test('recording for a managed child always waits for approval, records the adult and credits only once',async()=>{
 const owner=await setup(),guardian=await join(owner),stranger=await join(owner);const kid=(await call(guardian,'/children','POST',{name:'Mini'})).body.id,body=record();
 assert.equal((await call(stranger,'/tasks/record','POST',body,initial,kid)).status,403);
 const receipt=await call(guardian,'/tasks/record','POST',body,initial,kid);assert.equal(receipt.status,200);assert.equal(receipt.body.pending,true);assert.equal(receipt.body.stars,0);let s=await state(guardian,initial,kid);assert.equal(s.user.stars,0);assert.equal(s.tasks[0].status,'pending');assert.equal(s.tasks[0].approvalForChildren,true);
 assert.equal((await call(guardian,`/completions/${receipt.body.id}/approve`,'POST',{},initial,kid)).status,403);
 const approvals=await Promise.all([call(guardian,`/completions/${receipt.body.id}/approve`,'POST',{}),call(owner,`/completions/${receipt.body.id}/approve`,'POST',{})]);assert.deepEqual(approvals.map(r=>r.status).sort(),[200,409]);
 s=await state(guardian,initial,kid);assert.equal(s.user.stars,suggestedPoints(10).stars);assert.equal(s.completedCount,1);assert.equal((await state(guardian)).user.stars,0);
 const history=(await call(owner,'/history')).body.items;assert.ok(history.find((e:any)=>e.kind==='submitted').recordedBy);assert.equal((await call(guardian,'/tasks/record','POST',body,initial,kid)).body.replayed,true);
});
test('postponed daily rounds cannot complete early, invalidate stale offline requests and resume without duplicate credit',async()=>{
 const u=await setup(),t=await task(u),schedule=structuredClone(t.schedule);assert.equal((await call(u,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-01'))).status,200);
 let moved=(await state(u)).tasks[0];assert.equal(moved.status,'upcoming');assert.equal(moved.occurrenceKey,t.occurrenceKey);assert.deepEqual(moved.schedule,schedule);assert.equal((await complete(u,moved)).status,409);assert.equal((await complete(u,t,'2026-11-01')).status,409);
 assert.equal((await state(u)).planner.days[0].rounds.length,0);assert.equal((await state(u)).planner.days[3].rounds.length,1);
 moved=(await state(u,'2026-11-01')).tasks[0];assert.equal(moved.status,'today');const results=await Promise.all([complete(u,moved,'2026-11-01'),complete(u,moved,'2026-11-01')]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal((await state(u,'2026-11-01')).completedCount,1);
 const next=(await state(u,'2026-11-02')).tasks[0];assert.equal(next.occurrenceKey,'2026-11-02');assert.equal(next.status,'today');assert.equal((await complete(u,next,'2026-11-02')).status,200);assert.equal((await state(u,'2026-11-02')).completedCount,2);
});
test('postponement permissions, date validation, conflicts and approval locks are enforced',async()=>{
 const owner=await setup(),u=await join(owner),other=await setup(),s=await state(owner),t=await task(owner,{assignedTo:s.user.id});
 assert.equal((await call(u,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-01'))).status,403);assert.equal((await call(other,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-01'))).status,404);
 for(const until of ['2026-02-30',initial,'2028-01-01'])assert.equal((await call(owner,`/tasks/${t.id}/postpone`,'POST',defer(t,until))).status,400);
 const results=await Promise.all([call(owner,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-01')),call(owner,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-02'))]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const kid=(await call(owner,'/children','POST',{name:'Mini'})).body.id,claim=await call(owner,'/tasks/record','POST',record(),initial,kid),kt=(await state(owner,initial,kid)).tasks.find((t:any)=>t.id===claim.body.taskId);
 assert.equal((await call(owner,`/tasks/${kt.id}/postpone`,'POST',defer(kt,'2026-11-01'),initial,kid)).status,409);
});
test('deferring across a rotation boundary keeps the current assignee and checklist, backup roundtrips it',async()=>{
 const owner=await setup(),u=await join(owner),s=await state(owner),a=s.user.id,b=(await state(u)).user.id;
 let t=await task(owner,{cadence:'weekly',rotationIds:[a,b],steps:[{title:'Erster Schritt'}]});const current=t.effectiveAssignedTo;
 assert.equal((await call(owner,`/tasks/${t.id}/checklist`,'PATCH',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version,stepId:t.steps[0].id,done:true})).status,200);
 t=(await state(owner)).tasks.find((x:any)=>x.id===t.id);assert.equal((await call(owner,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-07'))).status,200);
 const later=(await state(owner,'2026-11-07')).tasks[0];assert.equal(later.effectiveAssignedTo,current);assert.equal(later.checklist.doneIds.length,1);assert.equal(later.occurrenceKey,t.occurrenceKey);
 await call(owner,'/tasks/record','POST',record());const backup=await call(owner,'/backups');assert.equal(backup.status,200,JSON.stringify(backup.body));const parsed=await parseBackup(backup.body);assert.deepEqual(parsed.payload.crew.tasks.find(x=>x.id===t.id)!.postponement,later.postponement);
});
test('a moved one-off can be undone and completed again without leaving duplicate net rewards',async()=>{
 const u=await setup(),t=await task(u,{cadence:'once',dueDate:initial});assert.equal((await call(u,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-01'))).status,200);
 let moved=(await state(u,'2026-11-01')).tasks[0];const result=await complete(u,moved,'2026-11-01');assert.equal(result.status,200);
 assert.equal((await call(u,`/completions/${result.body.id}/undo`,'POST',{},'2026-11-02')).status,200);let s=await state(u,'2026-11-02');assert.equal(s.user.stars,0);assert.equal(s.tasks[0].status,'overdue');assert.equal(s.tasks[0].occurrenceKey,'once');
 moved=s.tasks[0];assert.equal((await complete(u,moved,'2026-11-02')).status,200);s=await state(u,'2026-11-02');assert.equal(s.completedCount,1);assert.equal(s.user.stars,t.stars);
});
test('completion-relative schedules can move a later round despite retaining the previous completion',async()=>{
 const u=await setup();let t=await task(u,{cadence:'after',schedule:{startDate:initial,intervalDays:2}});assert.equal((await complete(u,t)).status,200);
 t=(await state(u,'2026-10-31')).tasks[0];assert.equal(t.occurrenceKey,'2026-10-31');
 assert.equal((await call(u,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-02'),'2026-10-31')).status,200);
 let s=await state(u,'2026-10-31');assert.equal(s.tasks[0].status,'upcoming');assert.equal(s.tasks[0].nextDueDate,'2026-11-02');assert.equal((await complete(u,s.tasks[0],'2026-10-31')).status,409);
 t=(await state(u,'2026-11-02')).tasks[0];assert.equal(t.occurrenceKey,'2026-10-31');const done=await complete(u,t,'2026-11-02');assert.equal(done.status,200);
 s=await state(u,'2026-11-02');assert.equal(s.tasks[0].nextDueDate,'2026-11-04');assert.equal(s.completedCount,2);
 assert.equal((await call(u,`/completions/${done.body.id}/undo`,'POST',{},'2026-11-03')).status,200);s=await state(u,'2026-11-03');assert.equal(s.tasks[0].status,'overdue');assert.equal(s.tasks[0].effectiveDueDate,'2026-11-02');assert.equal(s.completedCount,1);
});
test('shared missions and dates during pauses cannot be postponed; child approval survives a move',async()=>{
 const owner=await setup(),u=await join(owner),other=(await state(u)).user.id;let t=await task(owner);
 assert.equal((await call(owner,`/tasks/${t.id}/team`,'POST',{partnerId:other,occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0})).status,200);t=(await state(owner)).tasks[0];assert.equal((await call(owner,`/tasks/${t.id}/postpone`,'POST',defer(t,'2026-11-01'))).status,409);
 const paused=await task(owner,{pause:null});await call(owner,`/tasks/${paused.id}/pause`,'POST',{from:'2026-11-01',until:'2026-11-03'});const pt=(await state(owner)).tasks.find((x:any)=>x.id===paused.id);assert.equal((await call(owner,`/tasks/${pt.id}/postpone`,'POST',defer(pt,'2026-11-02'))).status,409);
 const kid=(await call(owner,'/children','POST',{name:'Mini'})).body.id,kt=await task(owner,{assignedTo:kid,approvalForChildren:true});assert.equal((await call(owner,`/tasks/${kt.id}/postpone`,'POST',defer(kt,'2026-11-01'),initial,kid)).status,200);
 const moved=(await state(owner,'2026-11-01',kid)).tasks.find((x:any)=>x.id===kt.id);const done=await complete(owner,moved,'2026-11-01',kid);assert.equal(done.status,200);assert.equal(done.body.pending,true);assert.equal((await state(owner,'2026-11-01',kid)).user.stars,0);
});
