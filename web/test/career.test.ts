import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {digest} from '../server/domain.ts';
import {ACHIEVEMENTS,GAME_OUTFITS,nextAchievements,achievementHint} from '../shared/game.ts';
import {evidenceCategory} from '../shared/categories.ts';
import {weekKey} from '../shared/planning.ts';
const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-10-30T12:00:00Z');
let mf:Miniflare,repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});const db=await mf.getD1Database('DB');repo=new Repository(db);for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8');for(const statement of sql.split('--> statement-breakpoint'))if(statement.trim())await db.prepare(statement).run();}});
after(async()=>{await mf.dispose();});
async function call(user:string,path:string,method='GET',body?:unknown,date=now,headers:Record<string,string>={}){const response=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),{userId:user},repo,{now:()=>date});return {status:response.status,body:await response.json() as any};}
async function setup(kind='family'){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false,kind})).status,201);await state(u);return u;}
async function state(u:string,date=now,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,date,headers);assert.equal(r.status,200);return r.body;}
async function task(u:string,category='laundry',extra:Record<string,unknown>={}){const r=await call(u,'/tasks','POST',{title:'Testmission',category,icon:category==='bath'?'bath':'laundry',room:'Haushalt',minutes:5,xp:20,stars:5,cadence:'daily',...extra});assert.equal(r.status,200);return r.body.id;}
async function complete(u:string,id:string,date=now,headers:Record<string,string>={}){const s=await state(u,date,headers),t=s.tasks.find((t:any)=>t.id===id);return call(u,`/tasks/${id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version},date,headers);}
async function raw(u:string){return JSON.parse((await repo.forAccount(u))!.document);}
async function seed(u:string,fn:(h:any)=>void){const h=await raw(u);fn(h);await repo.db.prepare('UPDATE households SET document=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(h),h.id).run();return h;}
function metric(s:any,id:string){return s.game.achievements.find((a:any)=>a.id===id);}
const personal=(n:number)=>({personalGoal:n,titleId:null,patchId:null});

test('legacy migration credits all reliable historical categories, excludes reversals and is durable',async()=>{
 const u=await setup(),h=await seed(u,h=>{delete h.members[0].career;h.members[0].completedCount=100;h.members[0].xp=2500;h.members[0].stars=222;});const m=h.members[0];
 const events=Array.from({length:61},(_,i)=>({id:crypto.randomUUID(),kind:'completion',userId:m.id,name:m.name,title:'Archived laundry',icon:'laundry',room:'Waschkeller',createdAt:'2026-10-12T12:00:00.000Z',taskId:crypto.randomUUID(),xp:20,stars:5}));
 for(const e of events)await repo.db.prepare('INSERT INTO events(id,household_id,member_id,kind,created_at,payload) VALUES(?,?,?,?,?,?)').bind(e.id,h.id,m.id,e.kind,e.createdAt,JSON.stringify(e)).run();
 const e={id:crypto.randomUUID(),kind:'correction',userId:m.id,name:m.name,title:'Archived laundry',createdAt:now.toISOString(),requestKey:'undo:'+events[0].id,reverses:events[0].id};
 await repo.db.prepare('INSERT INTO events(id,household_id,member_id,kind,created_at,request_key,payload) VALUES(?,?,?,?,?,?,?)').bind(e.id,h.id,m.id,e.kind,e.createdAt,e.requestKey,JSON.stringify(e)).run();
 let s=await state(u);assert.equal(metric(s,'wash').value,60);assert.equal(metric(s,'wash').unlocked,true);assert.equal(metric(s,'dust').unlocked,true);assert.equal(metric(s,'hero').unlocked,true);assert.equal(metric(s,'rhythm').value,0);assert.equal(s.user.xp,2500);assert.equal(s.user.stars,222);assert.ok(s.outfits.find((o:any)=>o.id==='captain').unlocked);
 const revision=(await repo.forAccount(u))!.revision;s=await state(u);assert.equal((await repo.forAccount(u))!.revision,revision);assert.equal(metric(s,'wash').value,60);
});

test('ten laundry completions unlock once, equip without charge, and corrections retain earned cosmetics',async()=>{
 const u=await setup(),id=await task(u);assert.equal((await call(u,'/outfits/wash/equip','POST',{})).status,403);
 await call(u,'/profile/achievement','PATCH',{achievementId:'wash'});
 let last:any;for(let i=0;i<10;i++){last=await complete(u,id,new Date(now.getTime()+i*86400000));assert.equal(last.status,200);if(i<9)assert.ok(!last.body.unlocks.some((x:any)=>x.achievementIds.includes('wash')));}
 const date=new Date(now.getTime()+9*86400000);assert.ok(last.body.unlocks[0].achievementIds.includes('wash'));let s=await state(u,date);assert.equal(metric(s,'wash').value,10);assert.ok(!nextAchievements(s.game.achievements,s.game.focusAchievementId).some(a=>a.id==='wash'));
 assert.equal((await complete(u,id,date)).status,409);assert.equal((await call(u,'/outfits/wash/equip','POST',{},date)).status,200);assert.equal((await state(u,date)).user.stars,50);
 const t=s.tasks[0];await call(u,`/tasks/${id}`,'PATCH',{...t,category:'bath',icon:'bath'},date);await call(u,`/tasks/${id}`,'DELETE',{},date);assert.equal((await call(u,`/completions/${last.body.id}/undo`,'POST',{},date)).status,200);
 s=await state(u,date);assert.equal(metric(s,'wash').value,9);assert.equal(metric(s,'shine').value,0);assert.equal(s.user.outfit,'wash');assert.ok(s.outfits.find((o:any)=>o.id==='wash').unlocked);
 assert.equal((await call(u,`/completions/${last.body.id}/undo`,'POST',{},date)).status,200);assert.equal(metric(await state(u,date),'wash').value,9);
});

test('five distinct categories unlock Allroundonaut; repeated categories do not inflate variety',async()=>{
 const u=await setup();for(const category of ['laundry','laundry','bath','kitchen','tidy','pets'])assert.equal((await complete(u,await task(u,category))).status,200);
 const s=await state(u);assert.equal(metric(s,'allround').value,5);assert.equal(metric(s,'wash').value,2);assert.equal(metric(s,'shine').value,1);assert.ok(s.outfits.find((o:any)=>o.id==='allround').unlocked);
 assert.equal((await call(u,'/tasks','POST',{title:'Wrong category',category:'made-up',room:'Haushalt',icon:'laundry',minutes:5,xp:20,stars:5,cadence:'daily'})).status,400);
});

test('ten bathroom missions unlock Glanzpilot without counting mere room placement',async()=>{
 const u=await setup();await complete(u,await task(u,'laundry',{room:'Bad'}));for(let i=0;i<10;i++)await complete(u,await task(u,'bath'));
 const s=await state(u);assert.equal(metric(s,'shine').value,10);assert.equal(metric(s,'wash').value,1);assert.ok(s.outfits.find((o:any)=>o.id==='shine').unlocked);
});

test('four personal goal weeks need not be consecutive and historical correction updates their count',async()=>{
 const u=await setup(),id=await task(u);await call(u,'/profile/game','PATCH',personal(1));let first='';
 const dates=['2026-10-30','2026-11-09','2026-11-23','2026-12-07'].map(d=>new Date(d+'T12:00:00Z'));
 for(let i=0;i<dates.length;i++){const r=await complete(u,id,dates[i]);assert.equal(r.status,200);if(i===0)first=r.body.id;assert.equal(metric(await state(u,dates[i]),'rhythm').value,i+1);}
 let s=await state(u,dates[3]);assert.ok(s.outfits.find((o:any)=>o.id==='polar').unlocked);assert.equal((await call(u,`/completions/${first}/undo`,'POST',{},dates[3])).status,200);
 s=await state(u,dates[3]);assert.equal(metric(s,'rhythm').value,3);assert.ok(s.outfits.find((o:any)=>o.id==='polar').unlocked);assert.equal(s.game.personalGoal.count,1);
});

test('personal goal edits affect only the current week and cannot rewrite previous targets',async()=>{
 const u=await setup(),id=await task(u);await call(u,'/profile/game','PATCH',personal(3));await complete(u,id);assert.equal(metric(await state(u),'rhythm').value,0);
 const next=new Date('2026-11-02T12:00:00Z');await state(u,next);await call(u,'/profile/game','PATCH',personal(1),next);await complete(u,id,next);
 const h=await raw(u),weeks=h.members[0].career.weeks;assert.equal(weeks['2026-10-26'].goal,3);assert.equal(weeks['2026-11-02'].goal,1);assert.equal(metric(await state(u,next),'rhythm').value,1);
});

test('pending children earn categories and unlocks only after approval from their original mission snapshot',async()=>{
 const u=await setup();const kid=(await call(u,'/children','POST',{name:'Mini'})).body.id;assert.ok(kid);const headers={'X-Putzonaut-Profile':kid};
 await call(u,'/profile/achievement','PATCH',{achievementId:'wash'},now,headers);
 for(let i=0;i<10;i++){const id=await task(u,'laundry',{approvalForChildren:true});const submitted=await complete(u,id,now,headers);assert.ok(submitted.body.pending);assert.equal(metric(await state(u,now,headers),'wash').value,i);
  const t=(await state(u)).tasks.find((t:any)=>t.id===id);await call(u,`/tasks/${id}`,'PATCH',{...t,category:'bath',icon:'bath'});
  const approved=await call(u,`/completions/${submitted.body.id}/approve`,'POST',{});assert.equal(approved.status,200);if(i===9){assert.equal(approved.body.unlocks[0].userId,kid);assert.ok(approved.body.unlocks[0].achievementIds.includes('wash'));}
 }
 const child=await state(u,now,headers);assert.equal(metric(child,'wash').value,10);assert.equal(metric(child,'shine').value,0);assert.equal(metric(await state(u),'wash').value,0);assert.ok(child.outfits.find((o:any)=>o.id==='wash').unlocked);
});

test('concurrent writes add each category and personal week completion exactly once',async()=>{
 const u=await setup(),a=await task(u,'laundry'),b=await task(u,'bath');const results=await Promise.all([complete(u,a),complete(u,a),complete(u,b)]);assert.equal(results.filter(r=>r.status===200).length,2);
 const s=await state(u),h=await raw(u);assert.equal(metric(s,'wash').value,1);assert.equal(metric(s,'shine').value,1);assert.equal(h.members[0].career.weeks[weekKey(now)].count,2);assert.equal(s.completedCount,2);
});

test('goal selection is per profile, rejects invalid or earned goals, and skips team goals in solo homes',async()=>{
 const u=await setup('solo');assert.equal((await call(u,'/profile/achievement','PATCH',{achievementId:'team'})).status,400);assert.equal((await call(u,'/profile/achievement','PATCH',{achievementId:'invented'})).status,400);
 assert.equal((await call(u,'/profile/achievement','PATCH',{achievementId:'wash'})).status,200);let s=await state(u);assert.equal(nextAchievements(s.game.achievements,s.game.focusAchievementId)[0].id,'wash');assert.ok(!nextAchievements(s.game.achievements).some(a=>a.id==='team'));
 await complete(u,await task(u));assert.equal((await call(u,'/profile/achievement','PATCH',{achievementId:'first'})).status,409);assert.equal((await call(u,'/profile/achievement','PATCH',{achievementId:null})).status,200);s=await state(u);assert.equal(s.game.focusAchievementId,null);
});

test('station stages follow six thresholds and are not confused with the number of successful weeks',async()=>{
 const u=await setup();for(const [wins,stage] of [[0,0],[3,3],[4,3],[5,4],[7,4],[8,5],[11,5],[12,6],[15,6]]){
  await seed(u,h=>{h.game.weeks={};for(let i=0;i<wins;i++){const key=weekKey(new Date(Date.UTC(2026,0,5+i*7,12)));h.game.weeks[key]={key,count:1,goal:1,quest:null};}});
  const s=await state(u);assert.equal(s.game.station.stage,stage);assert.equal(s.game.station.modules.filter((m:any)=>m.unlocked).length,stage);
 }
});

test('new career data survives backups and older 0.7-shaped backups migrate without invented weekly goals',async()=>{
 const u=await setup();await call(u,'/profile/achievement','PATCH',{achievementId:'wash'});await complete(u,await task(u));
 const saved=(await call(u,'/backups')).body;assert.equal(saved.payload.crew.members[0].career.categories.laundry,1);assert.equal(saved.payload.crew.members[0].focusAchievementId,'wash');
 const preview=(await call(u,'/backups/preview','POST',{backup:saved})).body;assert.equal((await call(u,'/backups/restore','POST',{backup:saved,expectedRevision:preview.expectedRevision,confirmation:'Testcrew'})).status,200);
 let s=await state(u);assert.equal(metric(s,'wash').value,1);assert.equal(s.game.focusAchievementId,'wash');const headers={'X-Putzonaut-Epoch':s.restoreEpoch};
 const old=structuredClone(saved);delete old.payload.crew.members[0].career;delete old.payload.crew.members[0].focusAchievementId;for(const e of old.payload.history)delete e.category;for(const t of old.payload.crew.tasks)delete t.category;const {checksum:_,...data}=old;old.checksum=await digest(JSON.stringify(data));
 const p=await call(u,'/backups/preview','POST',{backup:old},now,headers);assert.equal(p.status,200);assert.equal((await call(u,'/backups/restore','POST',{backup:old,expectedRevision:p.body.expectedRevision,confirmation:'Testcrew'},now,headers)).status,200);
 s=await state(u);assert.equal(metric(s,'wash').value,1);assert.equal(metric(s,'rhythm').value,0);assert.equal(s.user.stars,5);assert.equal(s.completedCount,1);
});

test('tampered career counters fail schema validation even with a recomputed checksum',async()=>{
 const u=await setup(),backup=(await call(u,'/backups')).body;backup.payload.crew.members[0].career.categories.laundry=-1;const {checksum:_,...data}=backup;backup.checksum=await digest(JSON.stringify(data));assert.equal((await call(u,'/backups/preview','POST',{backup})).status,400);
});

test('goal hints and ordering reflect actual remaining work and do not suggest completed achievements',()=>{
 const wash={...ACHIEVEMENTS.find(a=>a.id==='wash')!,value:8,unlocked:false};assert.equal(achievementHint(wash),'Noch 2 Wäschemissionen bis Waschonaut.');const rhythm={...ACHIEVEMENTS.find(a=>a.id==='rhythm')!,value:3,unlocked:false};assert.match(achievementHint(rhythm),/1 erreichte Zielwoche/);
 assert.equal(nextAchievements([wash,rhythm])[0].id,'wash');assert.equal(nextAchievements([wash,rhythm],'rhythm')[0].id,'rhythm');assert.equal(nextAchievements([{...wash,unlocked:true}]).length,0);
});

test('all advertised outfits resolve to distinct real project images and category inference stays conservative',async()=>{
 const files=await readdir(new URL('../public/art',import.meta.url));assert.equal(ACHIEVEMENTS.length,12);assert.equal(GAME_OUTFITS.length,10);for(const o of GAME_OUTFITS)assert.ok(files.includes(`hero-avatar${o.id==='starter'?'':'-'+o.id}.webp`));
 assert.equal(evidenceCategory({title:'Unbekannt',icon:'sparkles',room:'Haushalt'}),undefined);assert.equal(evidenceCategory({icon:'laundry',room:'Bad'}),'laundry');assert.equal(evidenceCategory({category:'pets',icon:'sparkles'}),'pets');
});
