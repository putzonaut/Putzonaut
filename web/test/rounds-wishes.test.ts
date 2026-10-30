import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {digest} from '../server/domain.ts';
import {roundMissions,roomSummaries,routineIdeas,elapsedRound} from '../shared/rounds.ts';
import {wishTotal} from '../shared/crew-wish.ts';
const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-10-30T12:00:00Z');
let mf:Miniflare,repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});repo=new Repository(await mf.getD1Database('DB'));for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(sql.trim())await repo.db.prepare(sql).run();});
after(async()=>{await mf.dispose();});
async function call(u:string,path:string,method='GET',body?:unknown,date=now,headers:Record<string,string>={}){const r=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),{userId:u},repo,{now:()=>date});return {status:r.status,body:await r.json() as any};}
async function state(u:string,date=now,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,date,headers);assert.equal(r.status,200);return r.body;}
async function setup(){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false})).status,201);await state(u);return u;}
async function raw(u:string){return JSON.parse((await repo.forAccount(u))!.document);}
async function seed(u:string,fn:(h:any)=>void){const h=await raw(u);fn(h);await repo.db.prepare('UPDATE households SET document=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(h),h.id).run();}
async function task(u:string,extra:Record<string,unknown>={}){const r=await call(u,'/tasks','POST',{title:'Eine Mission',category:'tidy',room:'Haushalt',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'daily',...extra});assert.equal(r.status,200,JSON.stringify(r.body));return r.body.id;}
async function complete(u:string,id:string,date=now,headers:Record<string,string>={}){const t=(await state(u,date,headers)).tasks.find((t:any)=>t.id===id);return call(u,`/tasks/${id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version},date,headers);}
async function join(u:string){const invite=(await call(u,'/invitations','POST',{})).body;const other=crypto.randomUUID();const token=invite.code??invite.token??invite.invite;const r=await call(other,'/auth/join','POST',{name:'Sam',invite:token});assert.equal(r.status,201,JSON.stringify({invite,result:r.body}));return other;}
async function wish(u:string,cost=100){const r=await call(u,'/crew-wishes','POST',{title:'Unser Ausflug',cost,icon:'gift',requestKey:crypto.randomUUID()});assert.equal(r.status,200,JSON.stringify(r.body));return r.body.id;}
async function money(u:string,id:string,action:string,amount?:number,key=crypto.randomUUID(),headers:Record<string,string>={}){return call(u,`/crew-wishes/${id}/${action}`,'POST',{amount,requestKey:key},now,headers);}
async function start(u:string,ids:string[],minutes=20,headers:Record<string,string>={}){return call(u,'/rounds','POST',{taskIds:ids,minutes},now,headers);}
async function action(u:string,a:string,date=now,taskId?:string){const r=(await state(u,date)).round;return call(u,`/rounds/${r.id}`,'PATCH',{version:r.version,action:a,taskId},date);}

test('round selection respects cumulative time, assignments, availability and the three-task cap',async()=>{
 const u=await setup();await task(u,{minutes:8});await task(u,{minutes:7});await task(u,{minutes:3});await task(u,{minutes:2});const s=await state(u),picked=roundMissions(s.tasks,s.user,10);assert.equal(picked.length,2);assert.equal(picked.reduce((n,t)=>n+t.minutes,0),5);
 assert.ok(roundMissions(s.tasks,s.user,20).length<=3);const id=await task(u,{minutes:15});assert.equal((await start(u,[id],10)).status,400);assert.equal((await start(u,[id,id],20)).status,409);
 const paused=s.tasks[0];await call(u,`/tasks/${paused.id}/pause`,'POST',{from:'2026-10-30',until:null});assert.equal((await start(u,[paused.id])).status,409);
});
test('round persists exact occurrences, awards only normal mission points, retains completed archived tasks',async()=>{
 const u=await setup(),a=await task(u),b=await task(u);assert.equal((await start(u,[a,b],10)).status,200);const id=(await state(u)).round.id;assert.equal((await start(u,[a])).status,409);
 const done=await complete(u,a);assert.equal(done.status,200);await call(u,`/tasks/${a}`,'DELETE',{});let s=await state(u);assert.equal(s.round.id,id);assert.equal(s.round.entries[0].outcome,'done');assert.equal(s.user.stars,5);assert.equal(s.round.entries[0].stars,5);
 await action(u,'skip',now,b);await action(u,'finish');s=await state(u);assert.ok(s.round.finishedAt);assert.equal(s.user.stars,5);assert.equal(s.tasks.find((t:any)=>t.id===b).status,'today');
 await call(u,`/completions/${done.body.id}/undo`,'POST',{});s=await state(u);assert.equal(s.round.entries[0].stars,0);assert.equal(s.user.stars,0);
});
test('timer survives elapsed wall time and pauses, rejects stale edits, gives no points on expiry',async()=>{
 const u=await setup(),a=await task(u);await start(u,[a],5);const original=(await state(u)).round;
 await action(u,'enable');let s=await state(u,new Date(now.getTime()+600000));assert.equal(elapsedRound(s.round,new Date(now.getTime()+600000).getTime()),600000);assert.equal(s.user.stars,0);assert.equal(s.round.entries[0].outcome,'open');
 assert.equal((await call(u,`/rounds/${original.id}`,'PATCH',{version:original.version,action:'finish'})).status,409);
 const later=new Date(now.getTime()+600000);await action(u,'pause',later);s=await state(u,new Date(now.getTime()+1200000));assert.equal(s.round.runningSince,null);assert.equal(elapsedRound(s.round,now.getTime()+1200000),600000);
 await action(u,'resume',new Date(now.getTime()+1200000));await action(u,'finish',new Date(now.getTime()+1260000));s=await state(u,new Date(now.getTime()+1260000));assert.equal(s.round.elapsedMs,660000);assert.equal(s.user.stars,0);
});
test('old daily occurrences cannot become a new round after midnight, task pauses and reassignment disable entries',async()=>{
 const u=await setup(),a=await task(u);await start(u,[a]);const tomorrow=new Date('2026-10-31T12:00:00Z');let s=await state(u,tomorrow);assert.equal(s.round.entries[0].available,false);
 await complete(u,a,tomorrow);s=await state(u,tomorrow);assert.equal(s.round.entries[0].outcome,'open');assert.equal(s.round.entries[0].stars,0);
});
test('routines use existing tasks in selected order, skip unavailable tasks and do not duplicate or award points',async()=>{
 const u=await setup(),a=await task(u),b=await task(u),c=await task(u);const routine=(await call(u,'/routines','POST',{title:'Abendrunde',taskIds:[b,a,c]})).body;
 await complete(u,b);await call(u,`/tasks/${c}`,'DELETE',{});assert.equal((await call(u,'/rounds','POST',{routineId:routine.id})).status,200);let s=await state(u);assert.deepEqual(s.round.entries.map((e:any)=>e.taskId),[a]);assert.equal(s.tasks.length,2);assert.equal(s.user.stars,5);
 await call(u,`/routines/${routine.id}`,'DELETE',{});s=await state(u);assert.equal(s.routines.length,0);assert.equal(s.tasks.length,2);assert.equal(s.round.entries.length,1);
});
test('child rounds remain pending until approved and rejection reopens the original round',async()=>{
 const u=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child},a=await task(u,{approvalForChildren:true});
 await start(u,[a],5,headers);const pending=await complete(u,a,now,headers);let s=await state(u,now,headers);assert.equal(s.round.entries[0].outcome,'pending');assert.equal(s.round.entries[0].stars,0);
 await call(u,`/completions/${pending.body.id}/reject`,'POST',{});s=await state(u,now,headers);assert.equal(s.round.entries[0].outcome,'open');
 const again=await complete(u,a,now,headers);await call(u,`/completions/${again.body.id}/approve`,'POST',{});s=await state(u,now,headers);assert.equal(s.round.entries[0].outcome,'done');assert.equal(s.round.entries[0].stars,5);assert.equal((await state(u)).user.stars,0);
});
test('room summaries distinguish empty, pending, paused, assigned and currently clear areas',async()=>{
 const u=await setup(),a=await task(u);let s=await state(u),rooms=roomSummaries(s.areas,s.tasks,s.user);assert.equal(rooms.find(r=>r.area.id==='kitchen')!.label,'Noch keine Missionen');assert.equal(rooms.find(r=>r.area.id==='household')!.open,1);
 await call(u,`/tasks/${a}/pause`,'POST',{from:'2026-10-30',until:null});s=await state(u);rooms=roomSummaries(s.areas,s.tasks,s.user);assert.equal(rooms.find(r=>r.area.id==='household')!.label,'Missionen pausieren');
 await call(u,`/tasks/${a}/resume`,'POST',{});await complete(u,a);s=await state(u);assert.equal(roomSummaries(s.areas,s.tasks,s.user).find(r=>r.area.id==='household')!.label,'Alles aktuell');
});
test('concurrent duplicate deposits charge exactly once and changed operation keys are rejected',async()=>{
 const u=await setup();await seed(u,h=>h.members[0].stars=100);const id=await wish(u),key=crypto.randomUUID();const results=await Promise.all([money(u,id,'deposit',40,key),money(u,id,'deposit',40,key)]);assert.ok(results.every(r=>r.status===200));let s=await state(u);assert.equal(s.user.stars,60);assert.equal(wishTotal(s.crewWish),40);
 assert.equal((await money(u,id,'withdraw',40,key)).status,409);assert.equal((await money(u,id,'deposit',20,key)).status,409);s=await state(u);assert.equal(s.user.stars,60);
});
test('concurrent different contributions never overspend a profile or overfund a target',async()=>{
 const u=await setup();await seed(u,h=>h.members[0].stars=100);const id=await wish(u,70),r=await Promise.all([money(u,id,'deposit',50),money(u,id,'deposit',50)]);assert.equal(r.filter(x=>x.status===200).length,1);const s=await state(u);assert.equal(s.user.stars,50);assert.equal(wishTotal(s.crewWish),50);
 assert.equal((await money(u,id,'deposit',-1)).status,400);assert.equal((await money(u,id,'deposit',0)).status,400);assert.equal((await money(u,id,'withdraw',51)).status,409);
});
test('contribution withdrawal and cancellation refund the correct profiles and remain idempotent',async()=>{
 const u=await setup();await seed(u,h=>h.members[0].stars=100);const id=await wish(u);await money(u,id,'deposit',60);const key=crypto.randomUUID();await money(u,id,'withdraw',20,key);await money(u,id,'withdraw',20,key);assert.equal((await state(u)).user.stars,60);
 const cancelKey=crypto.randomUUID();await money(u,id,'cancel',undefined,cancelKey);await money(u,id,'cancel',undefined,cancelKey);const s=await state(u);assert.equal(s.user.stars,100);assert.equal(s.crewWish,null);
});
test('shared redemption consumes pooled stars only once and is visible to all crew members',async()=>{
 const u=await setup(),other=await join(u);await seed(u,h=>h.members.forEach((m:any)=>m.stars=60));const id=await wish(u);await money(u,id,'deposit',40);await money(other,id,'deposit',60);assert.equal((await money(other,id,'redeem')).status,403);
 const key=crypto.randomUUID();const results=await Promise.all([money(u,id,'redeem',undefined,key),money(u,id,'redeem',undefined,key)]);assert.ok(results.every(r=>r.status===200));const s=await state(other);assert.equal(s.redemptions.length,1);assert.equal(s.redemptions[0].shared,true);assert.equal(s.redemptions[0].contributors.length,2);assert.equal(s.user.stars,0);assert.equal((await state(u)).user.stars,20);assert.equal(s.crewWish,null);
 assert.equal((await money(other,id,'withdraw',60)).status,409);assert.equal((await call(u,`/redemptions/${s.redemptions[0].id}/fulfill`,'POST',{})).status,200);
});
test('leaving or removing a child refunds their open pot contribution before membership ends',async()=>{
 const u=await setup(),other=await join(u);await seed(u,h=>h.members.forEach((m:any)=>m.stars=50));const id=await wish(u);await money(other,id,'deposit',30);const memberId=(await state(other)).user.id;
 assert.equal((await call(other,'/household/leave','POST',{})).status,200);let h=await raw(u);assert.equal(h.members.find((m:any)=>m.id===memberId).stars,50);assert.equal(wishTotal(h.crewWish),0);
 const child=(await call(u,'/children','POST',{name:'Lio'})).body.id;await seed(u,h=>h.members.find((m:any)=>m.id===child).stars=25);await money(u,id,'deposit',20,crypto.randomUUID(),{'X-Putzonaut-Profile':child});assert.equal((await call(u,`/members/${child}`,'DELETE',{})).status,200);h=await raw(u);assert.equal(h.members.find((m:any)=>m.id===child).stars,25);assert.equal(wishTotal(h.crewWish),0);
});
test('mission correction after depositing does not debit the shared pot again',async()=>{
 const u=await setup(),a=await task(u),done=await complete(u,a),id=await wish(u);await money(u,id,'deposit',5);await call(u,`/completions/${done.body.id}/undo`,'POST',{});let s=await state(u);assert.equal(s.user.stars,-5);assert.equal(wishTotal(s.crewWish),5);assert.equal((await money(u,id,'deposit',1)).status,409);await money(u,id,'withdraw',5);s=await state(u);assert.equal(s.user.stars,0);assert.equal(wishTotal(s.crewWish),0);
});
test('foreign children cannot access rounds or shared pot and children cannot manage wishes/routines',async()=>{
 const u=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child},other=await setup();const a=await task(u),id=await wish(u);
 assert.equal((await start(other,[a],5,headers)).status,403);assert.equal((await money(other,id,'deposit',1,crypto.randomUUID(),headers)).status,403);assert.equal((await call(u,'/routines','POST',{title:'Kleine Runde',taskIds:[a]},now,headers)).status,403);assert.equal((await money(u,id,'cancel',undefined,crypto.randomUUID(),headers)).status,403);
});
test('new data survives backup, legacy backup fields stay optional, invalid pooled balances fail',async()=>{
 const u=await setup(),a=await task(u);await seed(u,h=>h.members[0].stars=100);const id=await wish(u);await money(u,id,'deposit',40);await call(u,'/routines','POST',{title:'Abendrunde',taskIds:[a]});await start(u,[a]);await call(u,'/profile/motion','PATCH',{enabled:false});
 const backup=(await call(u,'/backups')).body;assert.equal(backup.payload.crew.crewWish.contributions[backup.payload.crew.members[0].id],40);const preview=(await call(u,'/backups/preview','POST',{backup})).body;assert.equal((await call(u,'/backups/restore','POST',{backup,expectedRevision:preview.expectedRevision,confirmation:'Testcrew'})).status,200);let s=await state(u);assert.equal(s.user.animations,false);assert.equal(s.round.entries.length,1);assert.equal(s.routines.length,1);assert.equal(s.user.stars,60);
 const headers={'X-Putzonaut-Epoch':s.restoreEpoch},bad=structuredClone(backup);bad.payload.crew.crewWish.contributions[s.user.id]=101;const {checksum:_,...data}=bad;bad.checksum=await digest(JSON.stringify(data));assert.equal((await call(u,'/backups/preview','POST',{backup:bad},now,headers)).status,400);
 const old=structuredClone(backup);delete old.payload.crew.crewWish;delete old.payload.crew.routines;for(const m of old.payload.crew.members){delete m.round;delete m.animations;}const {checksum:__,...oldData}=old;old.checksum=await digest(JSON.stringify(oldData));assert.equal((await call(u,'/backups/preview','POST',{backup:old},now,headers)).status,200);
});

test('ongoing rounds respect pauses and reassignment while another crew member can complete their occurrence',async()=>{
 const u=await setup(),other=await join(u),a=await task(u),otherId=(await state(other)).user.id;await start(u,[a]);
 await call(u,`/tasks/${a}/pause`,'POST',{from:'2026-10-30',until:null});assert.equal((await state(u)).round.entries[0].available,false);await call(u,`/tasks/${a}/resume`,'POST',{});
 await seed(u,h=>h.tasks.find((t:any)=>t.id===a).assignedTo=otherId);assert.equal((await state(u)).round.entries[0].available,false);const s=await state(u);assert.equal(roomSummaries(s.areas,s.tasks,s.user).find(r=>r.area.id==='household')!.next,undefined);
 await complete(other,a);assert.equal((await state(u)).round.entries[0].outcome,'crew');assert.equal((await state(u)).round.entries[0].stars,0);assert.equal((await state(other)).user.stars,5);
});
test('removing a child releases pending entries in another profile’s round and clears zero contributions',async()=>{
 const u=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child},a=await task(u,{approvalForChildren:true}),id=await wish(u);
 await seed(u,h=>h.members.find((m:any)=>m.id===child).stars=20);await money(u,id,'deposit',20,crypto.randomUUID(),headers);await money(u,id,'withdraw',20,crypto.randomUUID(),headers);
 await start(u,[a]);await complete(u,a,now,headers);let s=await state(u);assert.equal(s.round.entries[0].outcome,'pending');assert.equal(roomSummaries(s.areas,s.tasks,s.user).find(r=>r.area.id==='household')!.label,'Wartet auf Bestätigung');
 await call(u,`/members/${child}`,'DELETE',{});s=await state(u);assert.equal(s.round.entries[0].outcome,'open');assert.equal(s.round.entries[0].available,true);assert.equal(s.crewWish.contributions[child],undefined);assert.equal((await call(u,'/backups')).status,200);
});
test('creation retries and concurrent cancellation versus deposit preserve all stars',async()=>{
 const u=await setup();await seed(u,h=>h.members[0].stars=100);const value={title:'Unser Ausflug',cost:100,icon:'gift',requestKey:crypto.randomUUID()},first=await call(u,'/crew-wishes','POST',value),again=await call(u,'/crew-wishes','POST',value);assert.equal(first.body.id,again.body.id);assert.equal((await call(u,'/crew-wishes','POST',{...value,cost:90})).status,409);
 const id=first.body.id;await money(u,id,'deposit',30);const results=await Promise.all([money(u,id,'deposit',20),money(u,id,'cancel')]);assert.equal(results[1].status,200);assert.ok([200,409].includes(results[0].status));const s=await state(u);assert.equal(s.crewWish,null);assert.equal(s.user.stars,100);
});
test('a full shared wish can be cancelled or redeemed concurrently, never both',async()=>{
 const u=await setup();await seed(u,h=>h.members[0].stars=100);const id=await wish(u);await money(u,id,'deposit',100);const results=await Promise.all([money(u,id,'redeem'),money(u,id,'cancel')]);assert.equal(results.filter(x=>x.status===200).length,1);assert.equal(results.filter(x=>x.status===409).length,1);const s=await state(u);assert.equal(s.crewWish,null);assert.equal(s.user.stars+(s.redemptions.length?100:0),100);
});
test('personal spending and a shared contribution cannot consume the same stars twice',async()=>{
 const u=await setup();await seed(u,h=>h.members[0].stars=50);const id=await wish(u),reward=(await call(u,'/rewards','POST',{title:'Mein Wunsch',cost:40,icon:'gift'})).body.id;
 const results=await Promise.all([money(u,id,'deposit',40),call(u,`/rewards/${reward}/redeem`,'POST',{requestKey:crypto.randomUUID()})]);assert.equal(results.filter(x=>x.status===200).length,1);const s=await state(u);assert.equal(s.user.stars,10);assert.equal(wishTotal(s.crewWish)+s.redemptions.reduce((n:number,r:any)=>n+r.cost,0),40);
});
test('routine validation, unique suggestions and motion preferences remain isolated per profile',async()=>{
 const u=await setup(),a=await task(u,{room:'Küche',category:'tidy'}),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child};const s=await state(u);assert.ok(routineIdeas(s.tasks).every(r=>new Set(r.taskIds).size===r.taskIds.length));
 assert.equal((await call(u,'/routines','POST',{title:'Ungültig',taskIds:[a,a]})).status,400);assert.equal((await call(u,'/routines','POST',{title:'Ungültig',taskIds:[crypto.randomUUID()]})).status,400);assert.equal((await call(u,'/routines','PATCH',{title:'Ungültig',taskIds:[a]})).status,405);
 await call(u,'/profile/motion','PATCH',{enabled:false},now,headers);assert.equal((await state(u,now,headers)).user.animations,false);assert.equal((await state(u)).user.animations,true);
});
test('backup validation checks contribution owners and shared redemption history as well as the visible wish',async()=>{
 const u=await setup();await seed(u,h=>h.members[0].stars=100);const id=await wish(u);await money(u,id,'deposit',100);let backup=(await call(u,'/backups')).body;
 backup.payload.crew.crewWish.contributions={[crypto.randomUUID()]:100};let {checksum:_,...data}=backup;backup.checksum=await digest(JSON.stringify(data));assert.equal((await call(u,'/backups/preview','POST',{backup})).status,400);
 await money(u,id,'redeem');backup=(await call(u,'/backups')).body;assert.equal((await call(u,'/backups/preview','POST',{backup})).status,200);backup.payload.history.find((e:any)=>e.kind==='wish-redeem').redemption.contributors[0].stars=99;({checksum:_,...data}=backup);backup.checksum=await digest(JSON.stringify(data));assert.equal((await call(u,'/backups/preview','POST',{backup})).status,400);
});
