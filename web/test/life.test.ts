import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {makeBackup,parseBackup} from '../server/backup-schema.ts';
import {lifeMissions,effort,DECORATIONS} from '../shared/life.ts';
import {weekKey} from '../shared/planning.ts';
import {TASK_TEMPLATES} from '../shared/setup.ts';
import type {State} from '../src/types.ts';
const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-10-30T12:00:00Z');
let mf:Miniflare,repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});repo=new Repository(await mf.getD1Database('DB'));for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(sql.trim())await repo.db.prepare(sql).run();});
after(async()=>{await mf.dispose();});
async function call(u:string,path:string,method='GET',body?:unknown,date=now,headers:Record<string,string>={}){const r=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),{userId:u},repo,{now:()=>date});return {status:r.status,body:await r.json() as any};}
async function state(u:string,date=now,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,date,headers);assert.equal(r.status,200,JSON.stringify(r.body));return r.body as State;}
async function setup(){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false})).status,201);await state(u);return u;}
async function raw(u:string){return JSON.parse((await repo.forAccount(u))!.document);}
async function seed(u:string,fn:(h:any)=>void){const h=await raw(u);fn(h);await repo.db.prepare('UPDATE households SET document=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(h),h.id).run();}
async function task(u:string,extra:Record<string,unknown>={}){const r=await call(u,'/tasks','POST',{title:'Eine Mission',category:'tidy',room:'Haushalt',icon:'sparkles',minutes:5,xp:21,stars:5,cadence:'daily',...extra});assert.equal(r.status,200,JSON.stringify(r.body));return r.body.id as string;}
async function join(u:string){const invite=(await call(u,'/invitations','POST',{})).body;const other=crypto.randomUUID();assert.equal((await call(other,'/auth/join','POST',{name:'Sam',invite:invite.token})).status,201);return other;}
async function complete(u:string,id:string,date=now){const t=(await state(u,date)).tasks.find(t=>t.id===id)!;return call(u,`/tasks/${id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist!.version},date);}
async function team(u:string,id:string,partnerId:string,headers:Record<string,string>={}){const t=(await state(u,now,headers)).tasks.find(t=>t.id===id)!;const r=await call(u,`/tasks/${id}/team`,'POST',{partnerId,occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0},now,headers);assert.equal(r.status,200,JSON.stringify(r.body));return (await state(u)).tasks.find(t=>t.id===id)!.team!;}
async function confirm(u:string,id:string,headers:Record<string,string>={}){const t=(await state(u,now,headers)).tasks.find(t=>t.id===id)!;return call(u,`/tasks/${id}/team`,'PATCH',{teamId:t.team?.id,occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0},now,headers);}
async function away(u:string,scope='profile',until:string|null='2026-11-03',headers:Record<string,string>={}){return call(u,`/${scope}/away`,'PATCH',{from:'2026-10-30',until},now,headers);}

test('gentle mode chooses no more than three easy short own/free missions within ten minutes',async()=>{
 const u=await setup(),v=await join(u),other=(await state(v)).user.id;
 await task(u,{minutes:3});await task(u,{minutes:4});await task(u,{minutes:3});await task(u,{minutes:2});await task(u,{minutes:4,difficulty:'hard'});await task(u,{minutes:8});await task(u,{minutes:1,assignedTo:other});
 const s=await state(u),p=lifeMissions(s.tasks,s.user,20,'gentle');assert.ok(p.length<=3);assert.ok(p.reduce((n,t)=>n+t.minutes,0)<=10);assert.ok(p.every(t=>t.minutes<=5&&t.difficulty!=='hard'&&t.assignedTo!==other));
 const hard=s.tasks.find(t=>t.difficulty==='hard')!;assert.equal((await call(u,'/rounds','POST',{taskIds:[hard.id],minutes:10,mode:'gentle'})).status,400);
});
test('visitor mode prioritizes entry, guest WC and living area, never fills with unrelated tasks',async()=>{
 const u=await setup();await task(u,{title:'Schuhe wegräumen',minutes:3});await task(u,{title:'Toilette reinigen',room:'Bad',minutes:5});await task(u,{title:'Sofa ordnen',room:'Wohnen',minutes:2});const laundry=await task(u,{title:'Wäsche falten',minutes:1});
 const s=await state(u),p=lifeMissions(s.tasks,s.user,10,'visitors');assert.deepEqual(p.map(t=>t.minutes),[3,5,2]);assert.ok(!p.some(t=>t.id===laundry));const r=await call(u,'/rounds','POST',{taskIds:p.map(t=>t.id),minutes:10,mode:'visitors'});assert.equal(r.status,200);assert.equal((await state(u)).round?.title,'Besuch im Anflug!');
});
test('mental work has six new templates plus four existing suggestions, with no new category counters',()=>{const list=TASK_TEMPLATES.filter(t=>t.mental);assert.equal(list.length,10);assert.ok(list.every(t=>t.xp>0&&t.stars>0&&['household','kitchen'].includes(t.category)));});
test('personal pause blocks own fixed missions and own completions, leaves other people and one-off tasks intact',async()=>{
 const u=await setup(),v=await join(u),s=await state(u),mine=await task(u,{assignedTo:s.user.id}),free=await task(u),once=await task(u,{cadence:'once',assignedTo:s.user.id});await away(u);
 let a=await state(u);assert.equal(a.life.paused,true);assert.equal(a.tasks.find(t=>t.id===mine)?.status,'paused');assert.equal((await complete(u,free)).status,409);assert.equal((await complete(v,free)).status,200);
 const later=new Date('2026-11-04T12:00:00Z');a=await state(u,later);assert.equal(a.tasks.find(t=>t.id===mine)?.occurrenceKey,'2026-11-04');assert.equal(a.tasks.find(t=>t.id===once)?.status,'overdue');
});
test('crew break skips missed monthly and weekly rounds, future dates remain regular',async()=>{
 const u=await setup();const monthly=await task(u,{cadence:'monthly',schedule:{monthDay:30,startDate:'2026-10-01'}}),weekly=await task(u,{cadence:'weekly'});await away(u,'household','2026-11-04');const s=await state(u,new Date('2026-11-05T12:00:00Z'));
 assert.equal(s.tasks.find(t=>t.id===monthly)?.status,'upcoming');assert.equal(s.tasks.find(t=>t.id===monthly)?.nextDueDate,'2026-11-30');assert.equal(s.tasks.find(t=>t.id===weekly)?.status,'upcoming');assert.equal(s.tasks.find(t=>t.id===weekly)?.nextDueDate,'2026-11-09');
});
test('pause permissions, date validation, early return and replaced intervals preserve skipped rounds',async()=>{
 const u=await setup(),v=await join(u);assert.equal((await away(v,'household')).status,403);assert.equal((await call(u,'/profile/away','PATCH',{from:'2026-02-30',until:null})).status,400);assert.equal((await away(u,'profile','2026-10-29')).status,400);
 const monthly=await task(u,{assignedTo:(await state(u)).user.id,cadence:'monthly',schedule:{monthDay:30,startDate:'2026-10-01'}});await away(u,'profile',null);
 const nov=new Date('2026-11-02T12:00:00Z');await call(u,'/profile/away','DELETE',{},nov);assert.equal((await state(u,nov)).tasks.find(t=>t.id===monthly)?.status,'upcoming');
 await call(u,'/profile/away','PATCH',{from:'2026-11-05',until:'2026-11-07'},nov);assert.equal((await state(u,nov)).tasks.find(t=>t.id===monthly)?.status,'upcoming');
});
test('fixed weekly rotation skips absentees; balanced allocation uses effort and stays stable within a round',async()=>{
 const u=await setup(),v=await join(u),a=(await state(u)).user.id,b=(await state(v)).user.id;await seed(u,h=>h.members[0].effortWeeks={[weekKey(now)]:90});
 const id=await task(u,{rotationIds:[a,b],rotationMode:'balanced',minutes:20});let s=await state(u);assert.equal(s.tasks.find(t=>t.id===id)?.effectiveAssignedTo,b);
 await task(u,{assignedTo:b,minutes:180});s=await state(u);assert.equal(s.tasks.find(t=>t.id===id)?.effectiveAssignedTo,b);
 await away(v);s=await state(u);assert.equal(s.tasks.find(t=>t.id===id)?.effectiveAssignedTo,a);
 const weekly=await task(u,{rotationIds:[b,a]});assert.equal((await state(u)).tasks.find(t=>t.id===weekly)?.effectiveAssignedTo,a);
 assert.ok(effort({minutes:10,difficulty:'hard'})>effort({minutes:10,difficulty:'easy'}));
});
test('all rotation members away pauses tasks and skips missed sparse occurrences on return',async()=>{
 const u=await setup(),v=await join(u),a=(await state(u)).user.id,b=(await state(v)).user.id;const id=await task(u,{rotationIds:[a,b],rotationMode:'balanced',cadence:'monthly',schedule:{monthDay:30,startDate:'2026-10-01'}});await away(u);await away(v);
 assert.equal((await state(u)).tasks.find(t=>t.id===id)?.status,'paused');assert.equal((await state(u,new Date('2026-11-04T12:00:00Z'))).tasks.find(t=>t.id===id)?.status,'upcoming');
});
test('two people confirm once; odd rewards split exactly with no early points and no solo bypass',async()=>{
 const u=await setup(),v=await join(u),id=await task(u);const t=await team(u,id,(await state(v)).user.id);assert.deepEqual(t.shares.map(s=>s.stars),[3,2]);assert.deepEqual(t.shares.map(s=>s.xp),[11,10]);
 assert.equal((await complete(u,id)).status,409);assert.equal((await confirm(u,id)).status,200);assert.equal((await state(u)).user.stars,0);assert.equal((await confirm(u,id)).body.waiting,true);
 const r=await confirm(v,id);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.completed,true);const a=await state(u),b=await state(v);assert.equal(a.user.stars,3);assert.equal(b.user.stars,2);assert.equal(a.user.xp+b.user.xp,21);assert.equal(a.tasks[0].status,'done');
 const stats=(await call(v,'/statistics?days=7')).body;assert.deepEqual(stats.totals,{count:1,xp:10,stars:2,activeDays:1});
});
test('concurrent confirmations preserve one atomic set of awards and reversals undo both people once',async()=>{
 const u=await setup(),v=await join(u),id=await task(u);await team(u,id,(await state(v)).user.id);const t=(await state(u)).tasks[0],body={teamId:t.team!.id,occurrenceKey:t.occurrenceKey,taskVersion:t.revision};
 const r=await Promise.all([call(u,`/tasks/${id}/team`,'PATCH',body),call(v,`/tasks/${id}/team`,'PATCH',body),call(v,`/tasks/${id}/team`,'PATCH',body)]);assert.ok(r.some(x=>x.body.completed));assert.equal((await state(u)).user.stars+(await state(v)).user.stars,5);
 const log=(await call(v,'/history')).body.items.find((e:any)=>e.userId===(t.team!.shares[1].userId)&&e.kind==='completion');
 const undo=await Promise.all([call(v,`/completions/${log.id}/undo`,'POST',{}),call(v,`/completions/${log.id}/undo`,'POST',{})]);assert.ok(undo.every(r=>r.status===200));assert.equal((await state(u)).user.stars,0);assert.equal((await state(v)).user.stars,0);assert.equal((await state(u)).tasks[0].status,'today');
});
test('foreign members cannot confirm, edit or hijack a collaboration',async()=>{
 const u=await setup(),v=await join(u),third=await join(u),id=await task(u,{assignedTo:(await state(u)).user.id});await team(u,id,(await state(v)).user.id);const t=(await state(u)).tasks[0];
 assert.equal((await confirm(third,id)).status,403);assert.equal((await call(third,`/tasks/${id}/team`,'DELETE',{teamId:t.team!.id})).status,403);assert.equal((await call(u,`/tasks/${id}`,'PATCH',t)).status,409);
 assert.equal((await call(u,`/tasks/${id}/handover`,'POST',{occurrenceKey:t.occurrenceKey,taskVersion:t.revision})).status,409);
});
test('child participation waits for its guardian and both confirmations; rejection allows a new confirmation',async()=>{
 const u=await setup(),v=await join(u),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child},id=await task(u,{approvalForChildren:true});await team(u,id,child);await confirm(u,id);await confirm(u,id,headers);
 let s=await state(u);assert.equal(s.user.stars,0);const claim=s.pendingCompletions[0];assert.equal((await call(v,`/completions/${claim.id}/approve`,'POST',{})).status,403);
 assert.equal((await call(u,`/completions/${claim.id}/reject`,'POST',{})).status,200);await confirm(u,id,headers);s=await state(u);const r=await call(u,`/completions/${s.pendingCompletions[0].id}/approve`,'POST',{});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal((await state(u)).user.stars,3);assert.equal((await state(u,now,headers)).user.stars,2);
});
test('approving a child first does not award until the other participant confirms',async()=>{
 const u=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child},id=await task(u,{approvalForChildren:true});await team(u,id,child);await confirm(u,id,headers);const claim=(await state(u)).pendingCompletions[0];await call(u,`/completions/${claim.id}/approve`,'POST',{});assert.equal((await state(u)).user.stars,0);await confirm(u,id);assert.equal((await state(u,now,headers)).user.stars,2);
});
test('checklists remain mandatory for both and collaboration never bypasses child profile permissions',async()=>{
 const u=await setup(),v=await join(u),id=await task(u,{steps:[{title:'Alles einsammeln'}]});await team(u,id,(await state(v)).user.id);assert.equal((await confirm(u,id)).status,409);const t=(await state(v)).tasks[0];assert.equal((await call(v,`/tasks/${id}/checklist`,'PATCH',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist!.version,stepId:t.steps![0].id,done:true})).status,200);await confirm(u,id);assert.equal((await confirm(v,id)).body.completed,true);
 const child=(await call(u,'/children','POST',{name:'Lio'})).body.id;assert.equal((await call(v,'/profile/away','PATCH',{from:'2026-10-30',until:null},now,{'X-Putzonaut-Profile':child})).status,403);
});
test('cancelling, next day, member departure and an absence invalidate shared claims without points',async()=>{
 const u=await setup(),v=await join(u),id=await task(u);let t=await team(u,id,(await state(v)).user.id);await confirm(u,id);await call(v,`/tasks/${id}/team`,'DELETE',{teamId:t.id});assert.equal((await state(u)).tasks[0].team,undefined);assert.equal((await state(u)).user.stars,0);
 await team(u,id,(await state(v)).user.id);await away(v);assert.equal((await state(u)).tasks[0].team,undefined);await call(v,'/profile/away','DELETE',{});
 await team(u,id,(await state(v)).user.id);assert.equal((await state(u,new Date('2026-10-31T12:00:00Z'))).tasks[0].team,undefined);
 await team(u,id,(await state(v)).user.id);await call(v,'/household/leave','POST',{});assert.equal((await state(u)).tasks[0].team,undefined);
});
test('quests recognize both shared participants and undo removes both bonuses',async()=>{
 const u=await setup(),v=await join(u),id=await task(u);assert.equal((await call(u,'/quests','POST',{weekKey:weekKey(now),title:'Zusammen klar',taskIds:[id],repeat:false})).status,200);await team(u,id,(await state(v)).user.id);await confirm(u,id);await confirm(v,id);
 assert.equal((await state(u)).user.stars,23);assert.equal((await state(v)).user.stars,22);const e=(await call(u,'/history')).body.items.find((e:any)=>e.kind==='completion');await call(u,`/completions/${e.id}/undo`,'POST',{});assert.equal((await state(u)).user.stars,0);assert.equal((await state(v)).user.stars,0);
});
test('decorations are previewable, unlocked by evidence, captain-only, and never spend stars',async()=>{
 const u=await setup(),v=await join(u);assert.equal((await call(v,'/station/style','PATCH',{slot:'plant',itemId:'plant'})).status,403);assert.equal((await call(u,'/station/style','PATCH',{slot:'companion',itemId:'golden-broom'})).status,403);assert.equal((await call(u,'/station/style','PATCH',{slot:'plant',itemId:'sofa'})).status,403);
 await seed(u,h=>{h.members[0].completedCount=200;h.members[0].achievements.push('kehrminator');h.game.weeks['2026-10-19']={key:'2026-10-19',goal:2,count:2,quest:null};});
 for(const d of DECORATIONS)assert.equal((await call(u,'/station/style','PATCH',{slot:d.slot,itemId:d.id})).status,200,d.id);
 assert.equal((await state(u)).user.stars,0);await call(u,'/station/style','PATCH',{slot:'plant',itemId:null});assert.equal((await state(u)).life.decor.selected.plant,undefined);
});
test('backups retain absences, balanced assignment, team shares, pending approvals, efforts and decor',async()=>{
 const u=await setup(),v=await join(u),child=(await call(u,'/children','POST',{name:'Lio'})).body.id;const a=(await state(u)).user.id,b=(await state(v)).user.id;await task(u,{rotationIds:[a,b],rotationMode:'balanced'});const id=await task(u,{approvalForChildren:true});await team(u,id,child);await confirm(u,id,{'X-Putzonaut-Profile':child});await call(u,'/station/style','PATCH',{slot:'plant',itemId:'plant'});
 let row=(await repo.forAccount(u))!;let backup=await makeBackup(JSON.parse(row.document),(await repo.history(row.id,0,1000)).map(({reversed,...e})=>e),row.revision,now);assert.ok((await parseBackup(backup)).payload.crew.tasks.some(t=>t.team));
 const claim=(await state(u)).pendingCompletions[0];await call(u,`/completions/${claim.id}/approve`,'POST',{});await confirm(u,id);await away(v);row=(await repo.forAccount(u))!;backup=await makeBackup(JSON.parse(row.document),(await repo.history(row.id,0,1000)).map(({reversed,...e})=>e),row.revision,now);assert.ok((await parseBackup(backup)).payload.history.some(e=>e.teamEventIds));assert.ok(backup.payload.crew.members.some(m=>m.effortWeeks));
});


test('future balanced assignments remain undecided and fixed rotation retains the original weekly order',async()=>{
 const u=await setup(),v=await join(u),w=await join(u),a=(await state(u)).user.id,b=(await state(v)).user.id,c=(await state(w)).user.id;
 const id=await task(u,{rotationIds:[a,b,c]}),fair=await task(u,{rotationIds:[a,b,c],rotationMode:'balanced'});await away(v,'profile','2026-11-20');
 const future=(await state(u)).planner.days.slice(1).flatMap(d=>d.rounds).filter(r=>r.taskId===fair);assert.ok(future.every(r=>r.assignedTo===null));
 const weekTwo=await state(u,new Date('2026-11-09T12:00:00Z'));assert.equal(weekTwo.tasks.find(t=>t.id===id)?.effectiveAssignedTo,c);
});
test('expired group availability is remembered before a new personal absence is planned',async()=>{
 const u=await setup(),v=await join(u),a=(await state(u)).user.id,b=(await state(v)).user.id;const id=await task(u,{rotationIds:[a,b],cadence:'monthly',schedule:{monthDay:30,startDate:'2026-10-01'}});await away(u);await away(v);
 const date=new Date('2026-11-04T12:00:00Z');assert.equal((await state(u,date)).tasks.find(t=>t.id===id)?.status,'upcoming');
 await call(u,'/profile/away','PATCH',{from:'2026-11-06',until:'2026-11-08'},date);assert.equal((await state(u,date)).tasks.find(t=>t.id===id)?.status,'upcoming');
});
