import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {digest} from '../server/domain.ts';
import {parseBackup} from '../server/backup-schema.ts';
const origin='https://putzonaut-test.denny-subke.chatgpt.site',today='2026-11-03';
let mf:Miniflare,repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});repo=new Repository(await mf.getD1Database('DB'));for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(sql.trim())await repo.db.prepare(sql).run();});
after(async()=>{await mf.dispose();});
async function call(u:string,path:string,method='GET',body?:unknown,day=today,headers:Record<string,string>={}){const r=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),{userId:u},repo,{now:()=>new Date(day+'T12:00:00Z')});return {status:r.status,body:await r.json() as any};}
async function setup(){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false})).status,201);return u;}
async function state(u:string,day=today,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,day,headers);assert.equal(r.status,200);return r.body;}
async function join(u:string){const invite=(await call(u,'/invitations','POST',{})).body.token,other=crypto.randomUUID();assert.equal((await call(other,'/auth/join','POST',{name:'Robin',invite})).status,201);return other;}
const values=(extra:Record<string,unknown>={})=>({title:'Boden wischen',room:'Haushalt',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'daily',...extra});
async function task(u:string,extra:Record<string,unknown>={}){const r=await call(u,'/tasks','POST',values(extra));assert.equal(r.status,200,JSON.stringify(r.body));return (await state(u)).tasks.find((t:any)=>t.id===r.body.id);}
const omission=(t:any)=>({occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0,requestKey:crypto.randomUUID()});
const omit=(u:string,t:any,day=today,headers:Record<string,string>={})=>call(u,`/tasks/${t.id}/omit`,'POST',omission(t),day,headers);
const complete=(u:string,t:any,day=today,headers:Record<string,string>={})=>call(u,`/tasks/${t.id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0,checklistVersion:t.checklist.version,requestKey:crypto.randomUUID()},day,headers);

test('omission is atomic and idempotent, gives no rewards and invalidates stale offline completions',async()=>{
 const u=await setup(),t=await task(u,{steps:[{title:'Fläche frei machen'}]}),body=omission(t);
 await call(u,`/tasks/${t.id}/checklist`,'PATCH',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version,stepId:t.steps[0].id,done:true});
 await call(u,'/rounds','POST',{taskIds:[t.id],minutes:5});
 const before=await state(u),results=await Promise.all(Array.from({length:4},()=>call(u,`/tasks/${t.id}/omit`,'POST',body)));
 assert.deepEqual(results.map(r=>r.status),[200,200,200,200]);assert.equal(results.filter(r=>!r.body.replayed).length,1);
 const s=await state(u),next=s.tasks[0];assert.equal(s.user.xp,before.user.xp);assert.equal(s.user.stars,before.user.stars);assert.equal(s.completedCount,before.completedCount);assert.equal(s.household.weekCount,before.household.weekCount);
 assert.equal(s.round.entries[0].outcome,'skipped');assert.equal(s.round.entries[0].xp,0);assert.equal(s.round.entries[0].stars,0);
 assert.equal(next.status,'upcoming');assert.equal(next.nextDueDate,'2026-11-04');assert.equal(next.checklist.doneIds.length,0);assert.ok(next.checklist.version>t.checklist.version);
 assert.equal((await complete(u,t)).status,409);assert.equal((await omit(u,t)).status,409);assert.equal((await call(u,`/tasks/${t.id}/omit`,'POST',{...body,taskVersion:99})).status,409);
 const events=(await call(u,'/history')).body.items;assert.equal(events.filter((e:any)=>e.kind==='omitted').length,1);assert.equal(events.filter((e:any)=>e.kind==='completion').length,0);
 const tomorrow=(await state(u,'2026-11-04')).tasks[0];assert.equal(tomorrow.status,'today');assert.equal(tomorrow.checklist.doneIds.length,0);
 await call(u,`/tasks/${t.id}/checklist`,'PATCH',{occurrenceKey:tomorrow.occurrenceKey,checklistVersion:tomorrow.checklist.version,stepId:t.steps[0].id,done:true},'2026-11-04');
 assert.equal((await complete(u,tomorrow,'2026-11-04')).status,200);assert.equal((await state(u,'2026-11-04')).completedCount,1);
});
test('omission versus completion cannot both consume the same round',async()=>{
 const u=await setup(),t=await task(u);const results=await Promise.all([omit(u,t),complete(u,t)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const s=await state(u);assert.equal(s.completedCount,results[1].status===200?1:0);assert.equal(s.user.stars,results[1].status===200?5:0);
});
test('daily, weekly and month-end omissions retain their calendar schedule',async()=>{
 const u=await setup();
 for(const [cadence,schedule,next] of [['weekly',{startDate:today},'2026-11-09'],['monthly',{startDate:'2026-01-01',monthDay:31},'2026-11-30'],['monthly-interval',{startDate:'2026-01-31',intervalMonths:3},'2027-01-31']] as const){
  const t=await task(u,{cadence,schedule});assert.equal((await omit(u,t)).body.nextDueDate,next);
  const updated=(await state(u)).tasks.find((x:any)=>x.id===t.id);assert.deepEqual(updated.schedule,schedule);assert.equal(updated.status,'upcoming');
 }
});
test('after-completion tasks skip from today and later confirmed work establishes the following interval',async()=>{
 const u=await setup();let t=await task(u,{cadence:'after',schedule:{startDate:'2026-11-01',intervalDays:3}});
 assert.equal((await omit(u,t)).body.nextDueDate,'2026-11-06');t=(await state(u,'2026-11-06')).tasks[0];
 assert.equal((await complete(u,t,'2026-11-06')).status,200);let s=await state(u,'2026-11-06');assert.equal(s.tasks[0].nextDueDate,'2026-11-09');assert.equal(s.completedCount,1);
 t=(await state(u,'2026-11-09')).tasks[0];assert.equal((await omit(u,t,'2026-11-09')).body.nextDueDate,'2026-11-12');assert.equal((await state(u,'2026-11-09')).tasks[0].status,'upcoming');
});
test('only authorized open recurring rounds may be omitted',async()=>{
 const u=await setup(),other=await join(u),foreign=await setup(),me=(await state(u)).user.id;
 const assigned=await task(u,{assignedTo:me});assert.equal((await omit(other,assigned)).status,403);assert.equal((await omit(foreign,assigned)).status,404);
 const once=await task(u,{cadence:'once'});assert.equal((await omit(u,once)).status,400);
 const upcoming=await task(u,{schedule:{startDate:'2026-12-01'}});assert.equal((await omit(u,upcoming)).status,409);
 const paused=await task(u);await call(u,`/tasks/${paused.id}/pause`,'POST',{from:today,until:null});assert.equal((await omit(u,paused)).status,409);
 const finished=await task(u);assert.equal((await complete(u,finished)).status,200);assert.equal((await omit(u,finished)).status,409);
 const shared=await task(u);assert.equal((await call(u,`/tasks/${shared.id}/team`,'POST',{partnerId:(await state(other)).user.id,occurrenceKey:shared.occurrenceKey,taskVersion:shared.revision??0})).status,200);assert.equal((await omit(u,shared)).status,409);
 const free=await task(u);assert.equal((await omit(other,free)).status,200);
 const away=await task(u);await call(other,'/profile/away','PATCH',{from:today,until:null});assert.equal((await omit(other,away)).status,409);
});
test('managed children may skip without rewards but cannot skip pending approvals or another child’s tasks',async()=>{
 const owner=await setup(),guardian=await join(owner),stranger=await join(owner),child=(await call(guardian,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child};
 let t=await task(owner,{assignedTo:child,approvalForChildren:true});assert.equal((await omit(stranger,t,today,headers)).status,403);assert.equal((await omit(guardian,t,today,headers)).status,200);assert.equal((await state(guardian,today,headers)).user.stars,0);
 t=await task(owner,{assignedTo:child,approvalForChildren:true});assert.equal((await complete(guardian,t,today,headers)).body.pending,true);assert.equal((await omit(guardian,t,today,headers)).status,409);
});
test('season validation is shared by creation, updates, postponement and exported backup restoration',async()=>{
 const u=await setup(),schedule={startDate:'2026-01-01',activeMonths:[11,12]};const t=await task(u,{schedule});
 assert.equal((await call(u,`/tasks/${t.id}/postpone`,'POST',{occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0,until:'2027-01-02'})).status,400);
 assert.equal((await omit(u,t)).status,200);
 const b=(await call(u,'/backups')).body,parsed=await parseBackup(b),saved=parsed.payload.crew.tasks[0];assert.deepEqual(saved.schedule,schedule);assert.deepEqual(saved.omission,{occurrenceKey:today,on:today});
 const preview=await call(u,'/backups/preview','POST',{backup:b});assert.equal(preview.status,200);
 assert.equal((await call(u,'/backups/restore','POST',{backup:b,expectedRevision:preview.body.expectedRevision,confirmation:'Testcrew'})).status,200);
 const s=await state(u),headers={'X-Putzonaut-Epoch':s.restoreEpoch};assert.equal(s.tasks[0].nextDueDate,'2026-11-04');assert.equal(s.completedCount,0);
 for(const activeMonths of [[],[0],[13],[11,11]])assert.equal((await call(u,'/tasks','POST',values({schedule:{...schedule,activeMonths}}),today,headers)).status,400);
 assert.equal((await call(u,`/tasks/${t.id}`,'PATCH',values({cadence:'yearly',schedule:{startDate:'2026-01-01',activeMonths:[11]}}),today,headers)).status,400);
 for(const mutate of [(t:any)=>t.schedule.activeMonths=[],(t:any)=>t.omission.on='2026-12-01']){
  const bad=structuredClone(b);mutate(bad.payload.crew.tasks[0]);const {checksum:_,...data}=bad;bad.checksum=await digest(JSON.stringify(data));assert.equal((await call(u,'/backups/preview','POST',{backup:bad},today,headers)).status,400);
 }
 assert.deepEqual((await state(u,'2027-01-01')).tasks.map((t:any)=>[t.status,t.nextDueDate]),[['upcoming','2027-11-01']]);
});
test('omitting at the end of a season resumes in the next active month without an earned completion',async()=>{
 const u=await setup(),t=await task(u,{cadence:'after',schedule:{startDate:today,intervalDays:45,activeMonths:[11]}});
 assert.equal((await omit(u,t)).body.nextDueDate,'2027-11-01');assert.equal((await state(u)).tasks[0].status,'upcoming');assert.equal((await state(u,'2027-11-01')).tasks[0].occurrenceKey,'2027-11-01');
});
test('server groups ad-hoc rounds by room but retains the order of explicit routines',async()=>{
 const u=await setup(),a=await task(u,{areaId:'kitchen'}),b=await task(u,{areaId:'bath'}),c=await task(u,{areaId:'kitchen'});
 assert.equal((await call(u,'/rounds','POST',{taskIds:[a.id,b.id,c.id],minutes:20})).status,200);
 let s=await state(u);assert.deepEqual(s.round.entries.map((e:any)=>e.taskId),[a.id,c.id,b.id]);
 await call(u,`/rounds/${s.round.id}`,'PATCH',{version:s.round.version,action:'finish'});
 const r=await call(u,'/routines','POST',{title:'Meine Reihenfolge',taskIds:[a.id,b.id,c.id]});assert.equal(r.status,200);assert.equal((await call(u,'/rounds','POST',{routineId:r.body.id})).status,200);
 s=await state(u);assert.deepEqual(s.round.entries.map((e:any)=>e.taskId),[a.id,b.id,c.id]);
});
