import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {makeBackup,parseBackup} from '../server/backup-schema.ts';
import {previousWeek,recapFor,reminderDue,berlinTime} from '../shared/everyday.ts';
import {cacheSnapshot,appendIntent,intentFor,replayProblem,completionBody} from '../shared/offline.ts';
import {routineIdeas} from '../shared/rounds.ts';
import type {State,Task} from '../src/types.ts';
const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-10-30T18:00:00Z');
let mf:Miniflare,repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});repo=new Repository(await mf.getD1Database('DB'));for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(sql.trim())await repo.db.prepare(sql).run();});
after(async()=>{await mf.dispose();});
async function call(u:string,path:string,method='GET',body?:unknown,date=now,headers:Record<string,string>={}){const r=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),{userId:u},repo,{now:()=>date});return {status:r.status,body:await r.json() as any};}
async function state(u:string,date=now,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,date,headers);assert.equal(r.status,200);return r.body as State;}
async function setup(){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false})).status,201);await state(u);return u;}
async function raw(u:string){return JSON.parse((await repo.forAccount(u))!.document);}
async function seed(u:string,fn:(h:any)=>void){const h=await raw(u);fn(h);await repo.db.prepare('UPDATE households SET document=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(h),h.id).run();}
async function task(u:string,extra:Record<string,unknown>={}){const r=await call(u,'/tasks','POST',{title:'Eine Mission',category:'tidy',room:'Haushalt',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'daily',...extra});assert.equal(r.status,200,JSON.stringify(r.body));return r.body.id as string;}
async function join(u:string){const invite=(await call(u,'/invitations','POST',{})).body;const other=crypto.randomUUID();assert.equal((await call(other,'/auth/join','POST',{name:'Sam',invite:invite.token})).status,201);return other;}
async function request(u:string,id:string,swapTaskId?:string){const t=(await state(u)).tasks.find(t=>t.id===id)!;return call(u,`/tasks/${id}/handover`,'POST',{occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0,swapTaskId});}
async function intent(u:string,id:string,headers:Record<string,string>={}){const s=await state(u,now,headers),t=s.tasks.find(t=>t.id===id)!;return intentFor(s,t,t.steps?.map(s=>s.id)??[],crypto.randomUUID(),now);}
async function complete(u:string,id:string,date=now){const q=await intent(u,id);return call(u,`/tasks/${id}/complete`,'POST',completionBody(q),date);}
async function edit(u:string,id:string,extra:Record<string,unknown>){const t=(await raw(u)).tasks.find((t:any)=>t.id===id);return call(u,`/tasks/${id}`,'PATCH',{...t,...extra});}

test('recap follows Berlin calendar boundaries and actual historic goal, with no invented empty week',()=>{
 assert.equal(previousWeek(new Date('2026-10-25T23:00:00Z')),'2026-10-19');assert.equal(previousWeek(new Date('2026-10-25T22:59:00Z')),'2026-10-12');
 const weeks={'2026-10-19':{count:3,goal:7}};assert.deepEqual(recapFor(weeks,undefined,now),{week:'2026-10-19',through:'2026-10-25',count:3,goal:7,reached:false});
 assert.equal(recapFor(weeks,'2026-10-19',now),null);assert.equal(recapFor({},undefined,now),null);assert.equal(recapFor({'2026-10-19':{count:0,goal:7}},undefined,now),null);
});
test('recap dismissal persists for the selected profile and a corrected previous week is reflected',async()=>{
 const u=await setup();await seed(u,h=>h.members[0].career.weeks['2026-10-19']={count:5,goal:4});assert.equal((await state(u)).everyday.recap?.reached,true);
 await seed(u,h=>h.members[0].career.weeks['2026-10-19'].count=3);assert.equal((await state(u)).everyday.recap?.reached,false);
 assert.equal((await call(u,'/profile/recap','PATCH',{week:'2026-10-12'})).status,409);await call(u,'/profile/recap','PATCH',{week:'2026-10-19'});assert.equal((await state(u)).everyday.recap,null);
});
test('reminders use local time across DST, only once per day and only for an open mission',()=>{
 const setting={enabled:true,time:'02:30'};assert.equal(berlinTime(new Date('2026-10-25T00:30:00Z')),'02:30');
 assert.equal(reminderDue(setting,true,new Date('2026-10-25T00:29:00Z')),false);assert.equal(reminderDue(setting,true,new Date('2026-10-25T00:30:00Z')),true);
 assert.equal(reminderDue({...setting,seenDay:'2026-10-25'},true,new Date('2026-10-25T01:30:00Z')),false);assert.equal(reminderDue(setting,false,now),false);
 assert.equal(reminderDue(undefined,true,now),false);assert.equal(berlinTime(new Date('2026-03-29T01:00:00Z')),'03:00');
});
test('concurrent reminder claims produce one visible reminder and completed or foreign tasks stay quiet',async()=>{
 const u=await setup(),other=await join(u),otherId=(await state(other)).user.id;await task(u,{assignedTo:otherId});
 await call(u,'/profile/reminder','PATCH',{enabled:true,time:'18:00'});assert.equal((await state(u)).everyday.reminder.due,false);
 const id=await task(u);assert.equal((await state(u)).everyday.reminder.due,true);
 const results=await Promise.all([call(u,'/profile/reminder/seen','POST',{day:'2026-10-30'}),call(u,'/profile/reminder/seen','POST',{day:'2026-10-30'})]);assert.equal(results.filter(r=>r.body.show).length,1);
 assert.equal((await state(u)).everyday.reminder.due,false);await complete(u,id);
 const next=new Date('2026-10-31T18:00:00Z');assert.equal((await state(u,next)).everyday.reminder.due,true);
 assert.equal((await call(u,'/profile/reminder','PATCH',{enabled:true,time:'25:00'})).status,400);
});
test('handover needs explicit acceptance and changes only the current occurrence',async()=>{
 const u=await setup(),other=await join(u),s=await state(u),otherId=(await state(other)).user.id,id=await task(u,{assignedTo:s.user.id});
 const r=await request(u,id);assert.equal(r.status,200);assert.equal((await state(u)).tasks[0].effectiveAssignedTo,s.user.id);
 assert.equal((await call(u,`/tasks/${id}/handover/${r.body.id}`,'PATCH',{action:'accept'})).status,403);
 assert.equal((await call(other,`/tasks/${id}/handover/${r.body.id}`,'PATCH',{action:'accept'})).status,200);
 let updated=await state(u);assert.equal(updated.tasks[0].effectiveAssignedTo,otherId);assert.equal(updated.everyday.handovers.length,0);assert.equal(updated.user.stars,0);
 updated=await state(u,new Date('2026-10-31T18:00:00Z'));assert.equal(updated.tasks[0].effectiveAssignedTo,s.user.id);
});
test('swap is targeted and atomic, preserves future weekly rotation and cannot be accepted twice',async()=>{
 const u=await setup(),other=await join(u),third=await join(u),me=(await state(u)).user.id,them=(await state(other)).user.id;
 const a=await task(u,{rotationIds:[me,them]}),b=await task(u,{assignedTo:them}),r=await request(u,a,b);assert.equal(r.status,200);
 assert.equal((await call(third,`/tasks/${a}/handover/${r.body.id}`,'PATCH',{action:'accept'})).status,403);
 const results=await Promise.all([call(other,`/tasks/${a}/handover/${r.body.id}`,'PATCH',{action:'accept'}),call(other,`/tasks/${a}/handover/${r.body.id}`,'PATCH',{action:'accept'})]);assert.equal(results.filter(r=>r.status===200).length,1);
 const s=await state(u);assert.equal(s.tasks.find(t=>t.id===a)?.effectiveAssignedTo,them);assert.equal(s.tasks.find(t=>t.id===b)?.effectiveAssignedTo,me);
 const next=await state(u,new Date('2026-11-02T18:00:00Z'));assert.equal(next.tasks.find(t=>t.id===a)?.effectiveAssignedTo,them);assert.equal(next.tasks.find(t=>t.id===b)?.effectiveAssignedTo,them);
});
test('task editing, pausing, archiving and member removal invalidate associated requests',async()=>{
 const u=await setup(),other=await join(u),me=(await state(u)).user.id,them=(await state(other)).user.id,a=await task(u,{assignedTo:me}),b=await task(u,{assignedTo:them});
 let r=await request(u,a,b);await edit(u,b,{title:'Anderer Einsatz'});assert.equal((await call(other,`/tasks/${a}/handover/${r.body.id}`,'PATCH',{action:'accept'})).status,409);
 await request(u,a,b);await call(u,`/tasks/${b}/pause`,'POST',{from:'2026-10-30',until:null});assert.equal((await state(u)).everyday.handovers.length,0);await call(u,`/tasks/${b}/resume`,'POST',{});
 await request(u,a,b);await call(u,`/tasks/${b}`,'DELETE',{});assert.equal((await state(u)).everyday.handovers.length,0);
 r=await request(u,a);await call(u,`/tasks/${a}/handover/${r.body.id}`,'DELETE',{});assert.equal((await state(u)).everyday.handovers.length,0);
 const c=await task(u,{assignedTo:them});await request(other,c);await call(other,'/household/leave','POST',{});const s=await state(u);assert.equal(s.everyday.handovers.length,0);assert.equal(s.tasks.find(t=>t.id===c)?.effectiveAssignedTo,null);
});
test('open handovers expire when the scheduled occurrence changes or is completed',async()=>{
 const u=await setup(),other=await join(u),me=(await state(u)).user.id,id=await task(u,{assignedTo:me}),r=await request(u,id);
 assert.equal((await call(other,`/tasks/${id}/handover/${r.body.id}`,'PATCH',{action:'accept'},new Date('2026-10-31T18:00:00Z'))).status,409);
 await complete(u,id);assert.equal((await state(other)).everyday.handovers.length,0);
});
test('duplicate queued completion requests credit exactly once, including concurrent retry and archive',async()=>{
 const u=await setup(),id=await task(u),q=await intent(u,id),body=completionBody(q);
 const results=await Promise.all([call(u,`/tasks/${id}/complete`,'POST',body),call(u,`/tasks/${id}/complete`,'POST',body)]);assert.ok(results.every(r=>r.status===200));assert.equal(results[0].body.id,results[1].body.id);
 let s=await state(u);assert.equal(s.user.stars,5);assert.equal(s.completedCount,1);
 await call(u,`/tasks/${id}`,'DELETE',{});assert.equal((await call(u,`/tasks/${id}/complete`,'POST',body)).status,200);s=await state(u);assert.equal(s.user.stars,5);
 assert.equal((await call(u,`/tasks/${id}/complete`,'POST',{...body,taskVersion:2})).status,409);
});
test('offline checklist and completion commit together without partial progress or duplicate steps',async()=>{
 const u=await setup(),id=await task(u,{steps:[{title:'Aufräumen'},{title:'Wischen'}]}),q=await intent(u,id);
 assert.equal((await call(u,`/tasks/${id}/complete`,'POST',{...completionBody(q),checkedStepIds:q.checkedStepIds.slice(0,1)})).status,409);
 assert.equal((await state(u)).tasks[0].checklist?.doneIds.length,0);
 assert.equal((await call(u,`/tasks/${id}/complete`,'POST',{...completionBody(q),checkedStepIds:[q.checkedStepIds[0],q.checkedStepIds[0]]})).status,409);
 assert.equal((await call(u,`/tasks/${id}/complete`,'POST',completionBody(q))).status,200);assert.equal((await state(u)).tasks[0].checklist?.doneIds.length,2);
});
test('offline intents reject edited tasks, later rounds, pauses and reassigned missions',async()=>{
 const u=await setup(),other=await join(u),me=(await state(u)).user.id,id=await task(u,{assignedTo:me}),q=await intent(u,id);
 await edit(u,id,{xp:80});assert.equal((await call(u,`/tasks/${id}/complete`,'POST',completionBody(q))).status,409);
 const q2=await intent(u,id);assert.equal((await call(u,`/tasks/${id}/complete`,'POST',completionBody(q2),new Date('2026-10-31T18:00:00Z'))).status,409);
 await call(u,`/tasks/${id}/pause`,'POST',{from:'2026-10-30',until:null});assert.equal((await call(u,`/tasks/${id}/complete`,'POST',completionBody(q2))).status,409);await call(u,`/tasks/${id}/resume`,'POST',{});
 const q3=await intent(u,id),r=await request(u,id);await call(other,`/tasks/${id}/handover/${r.body.id}`,'PATCH',{action:'accept'});assert.equal((await call(u,`/tasks/${id}/complete`,'POST',completionBody(q3))).status,409);assert.equal((await state(u)).user.stars,0);
});
test('queued child completion waits for approval and replay after approval never adds a second credit',async()=>{
 const u=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child},id=await task(u,{approvalForChildren:true}),q=await intent(u,id,headers);
 const result=await call(u,`/tasks/${id}/complete`,'POST',completionBody(q),now,headers);assert.equal(result.body.pending,true);assert.equal((await state(u,now,headers)).user.stars,0);
 await call(u,`/completions/${result.body.id}/approve`,'POST',{});assert.equal((await call(u,`/tasks/${id}/complete`,'POST',completionBody(q),now,headers)).status,200);assert.equal((await state(u,now,headers)).user.stars,5);assert.equal((await state(u)).user.stars,0);
});
test('restore epochs, foreign household or viewer and unauthorized child profiles reject queued writes',async()=>{
 const u=await setup(),other=await join(u),id=await task(u),q=await intent(u,id),body=completionBody(q);
 assert.equal((await call(other,`/tasks/${id}/complete`,'POST',body,now,{'X-Putzonaut-Viewer':q.viewerId})).status,409);
 assert.equal((await call(u,`/tasks/${id}/complete`,'POST',body,now,{'X-Putzonaut-Household':crypto.randomUUID()})).status,409);
 await seed(u,h=>h.restoreEpoch='new-epoch');assert.equal((await call(u,`/tasks/${id}/complete`,'POST',body)).status,409);assert.equal((await state(u)).user.stars,0);
});
test('offline cache preserves queue across refreshes, isolates accounts and flags restored snapshots',async()=>{
 const u=await setup(),id=await task(u),s=await state(u),q=await intent(u,id);let data=cacheSnapshot(undefined,s);appendIntent(data,q);appendIntent(data,{...q,requestKey:crypto.randomUUID()});assert.equal(data.queue.length,1);
 data=cacheSnapshot(data,{...s,revision:s.revision+1});assert.equal(data.queue[0].requestKey,q.requestKey);
 const restored=cacheSnapshot(data,{...s,restoreEpoch:'new'});assert.equal(restored.queue[0].status,'conflict');assert.ok(replayProblem(q,restored.snapshot));
 assert.equal(cacheSnapshot(data,{...s,viewer:{...s.viewer,id:'someone-else'}}).queue.length,0);assert.equal(cacheSnapshot(data,{...s,household:{...s.household,id:'another'}}).queue.length,0);
 assert.throws(()=>appendIntent(data,{...q,viewerId:'wrong'}));assert.equal(replayProblem(q,s),null);
});
test('offline queue caps at 50 entries without losing existing intents',async()=>{
 const u=await setup(),id=await task(u),s=await state(u),q=await intent(u,id),d=cacheSnapshot(undefined,s);for(let i=0;i<50;i++)appendIntent(d,{...q,requestKey:crypto.randomUUID(),taskId:String(i)});
 assert.throws(()=>appendIntent(d,{...q,taskId:'extra'}));assert.equal(d.queue.length,50);
});
test('new everyday state survives backup and rejects unknown handover references',async()=>{
 const u=await setup(),other=await join(u),me=(await state(u)).user.id,them=(await state(other)).user.id,a=await task(u,{assignedTo:me}),b=await task(u,{assignedTo:them});await request(u,a,b);await call(u,'/profile/reminder','PATCH',{enabled:true,time:'17:15'});
 const h=await raw(u),backup=await makeBackup(h,await repo.history(h.id,0,1000),1,now),parsed=await parseBackup(backup);assert.equal(parsed.payload.crew.tasks[0].handover?.swapTaskId,b);assert.equal(parsed.payload.crew.members[0].reminder?.time,'17:15');
 h.tasks[0].handover.swapTaskId=crypto.randomUUID();await assert.rejects(makeBackup(h,[],1,now));
});
test('everyday routine ideas use canonical categories and at most three unique existing missions',async()=>{
 const u=await setup();await task(u,{title:'Küchenpflanzen',category:'plants',room:'Küche'});await task(u,{title:'Geschirr einräumen',category:'kitchen'});await task(u,{category:'tidy'});await task(u,{category:'bath'});const s=await state(u),ideas=routineIdeas(s.tasks);
 assert.ok(['Besuch kommt','Feierabend schaffen','Küche nach dem Kochen'].every(title=>ideas.some(r=>r.title===title)));
 assert.ok(ideas.every(r=>r.taskIds.length<=3&&new Set(r.taskIds).size===r.taskIds.length));const kitchen=ideas.find(r=>r.title==='Küche nach dem Kochen')!;assert.ok(kitchen.taskIds.every(id=>s.tasks.find(t=>t.id===id)?.category==='kitchen'));
});

test('a real correction adjusts the previous-week recap without replacing its historical target',async()=>{
 const u=crypto.randomUUID(),past=new Date('2026-10-23T12:00:00Z');await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Rückblick',starterTasks:false},past);await state(u,past);
 const created=await call(u,'/tasks','POST',{title:'Eine echte Mission',room:'Haushalt',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'once'},past);const id=created.body.id;
 const done=await call(u,`/tasks/${id}/complete`,'POST',{occurrenceKey:'once',checklistVersion:0},past);assert.equal(done.status,200);
 assert.equal((await state(u)).everyday.recap?.count,1);const goal=(await state(u)).everyday.recap?.goal;assert.equal(goal,3);
 await call(u,`/completions/${done.body.id}/undo`,'POST',{});assert.equal((await state(u)).everyday.recap,null);assert.equal((await raw(u)).members[0].career.weeks['2026-10-19'].goal,goal);
});
test('reminder settings and claims belong to the selected authorized child profile',async()=>{
 const u=await setup(),other=await join(u),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child};await task(u);
 assert.equal((await call(u,'/profile/reminder','PATCH',{enabled:true,time:'18:00'},now,headers)).status,200);assert.equal((await state(u)).everyday.reminder.enabled,false);assert.equal((await state(u,now,headers)).everyday.reminder.due,true);
 assert.equal((await call(other,'/profile/reminder/seen','POST',{day:'2026-10-30'},now,headers)).status,403);assert.equal((await call(u,'/profile/reminder/seen','POST',{day:'2026-10-30'},now,headers)).body.show,true);assert.equal((await state(u,now,headers)).everyday.reminder.due,false);
});
test('a delayed replay cannot award a corrected completion again or reuse its stale task version',async()=>{
 const u=await setup(),id=await task(u),q=await intent(u,id),body=completionBody(q),done=await call(u,`/tasks/${id}/complete`,'POST',body);await call(u,`/completions/${done.body.id}/undo`,'POST',{});
 assert.equal((await call(u,`/tasks/${id}/complete`,'POST',body)).status,200);assert.equal((await state(u)).user.stars,0);assert.equal((await call(u,`/tasks/${id}/complete`,'POST',{...body,requestKey:crypto.randomUUID()})).status,409);
});
