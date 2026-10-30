import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {digest} from '../server/domain.ts';
import {ACHIEVEMENTS,GAME_OUTFITS,achievementHint} from '../shared/game.ts';
import {weekKey} from '../shared/planning.ts';

const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-10-30T12:00:00Z');
let mf:Miniflare,repo:Repository;
before(async()=>{
 mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});
 repo=new Repository(await mf.getD1Database('DB'));
 for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())
  for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(sql.trim())await repo.db.prepare(sql).run();
});
after(async()=>{await mf.dispose();});
async function call(u:string,path:string,method='GET',body?:unknown,headers:Record<string,string>={}){
 const response=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),{userId:u},repo,{now:()=>now});
 return {status:response.status,body:await response.json() as any};
}
async function state(u:string,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,headers);assert.equal(r.status,200);return r.body;}
async function setup(kind='family'){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false,kind})).status,201);await state(u);return u;}
async function raw(u:string){return JSON.parse((await repo.forAccount(u))!.document);}
async function seed(u:string,fn:(h:any)=>void){const h=await raw(u);fn(h);await repo.db.prepare('UPDATE households SET document=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(h),h.id).run();}
async function task(u:string,extra:Record<string,unknown>={}){const r=await call(u,'/tasks','POST',{title:'Testmission',category:'household',room:'Haushalt',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'once',...extra});assert.equal(r.status,200);return r.body.id;}
async function complete(u:string,id:string,headers:Record<string,string>={}){const t=(await state(u,headers)).tasks.find((t:any)=>t.id===id);return call(u,`/tasks/${id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version},headers);}
const achievement=(s:any,id:string)=>s.game.achievements.find((a:any)=>a.id===id);
function historicalWeeks(h:any,wins:number){h.game.weeks={};for(let i=0;i<wins;i++){const key=weekKey(new Date(Date.UTC(2026,0,5+i*7,12)));h.game.weeks[key]={key,count:3,goal:3,quest:null};}}

test('0.11 earned badges, titles and outfits remain usable below every raised threshold without charges',async()=>{
 const u=await setup(),oldIds=ACHIEVEMENTS.filter(a=>!['harry-putzer','albert-reinstein','clean-elisabeth'].includes(a.id)).map(a=>a.id);
 await seed(u,h=>{const m=h.members[0];m.achievements=oldIds;m.unlocked=GAME_OUTFITS.map(o=>o.id);m.patchId='george-cleaney';m.titleId='hero';m.outfit='sun';m.stars=7;m.completedCount=0;m.xp=0;});
 const s=await state(u);assert.ok(oldIds.every(id=>achievement(s,id).unlocked));assert.equal(s.user.patchId,'george-cleaney');assert.equal(s.user.title,'Haushaltsheld');
 for(const id of ['sun','comet','captain','garden','polar'])assert.equal((await call(u,`/outfits/${id}/equip`,'POST',{})).status,200);
 assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:'franz-beckenkehrer'})).status,200);
 const saved=await state(u);assert.equal(saved.user.stars,7);assert.equal(saved.user.xp,0);assert.equal(saved.completedCount,0);
 assert.ok(['harry-putzer','albert-reinstein','clean-elisabeth'].every(id=>!achievement(saved,id).unlocked));
});

test('unearned goals use the higher thresholds while first mission and two-person team remain accessible',async()=>{
 const u=await setup();await seed(u,h=>{const m=h.members[0];m.completedCount=10;m.career.categories={plants:5,kitchen:10,laundry:10,bath:10,tidy:20};for(let i=1;i<=4;i++)m.career.weeks[weekKey(new Date(now.getTime()-i*14*86400000))]={count:3,goal:3};});
 let s=await state(u);assert.equal(achievement(s,'first').unlocked,true);
 for(const id of ['steady','garden','kitchen','wash','shine','allround','rhythm','franz-beckenkehrer'])assert.equal(achievement(s,id).unlocked,false,id);
 assert.equal((await call(u,'/profile/achievement','PATCH',{achievementId:'garden'})).status,200);
 assert.match(achievementHint(achievement(s,'garden')),/Noch 1 Pflanzenmission/);
 assert.equal((await call(u,'/children','POST',{name:'Lio'})).status,200);s=await state(u);assert.equal(achievement(s,'team').unlocked,true);
 for(const [count,id] of [[25,'nebula'],[50,'dust'],[100,'hero'],[150,'kehrminator']] as const){await seed(u,h=>{h.members[0].completedCount=count;});assert.equal(achievement(await state(u),id).unlocked,false,id);}
});

test('Komet costs exactly 350 stars once; Sonnenheld needs level 9 and no stars',async()=>{
 const u=await setup();await seed(u,h=>{h.members[0].stars=349;h.members[0].xp=3999;});
 assert.equal((await call(u,'/outfits/comet/equip','POST',{})).status,409);assert.equal((await call(u,'/outfits/sun/equip','POST',{})).status,409);
 await seed(u,h=>{h.members[0].stars=350;h.members[0].xp=4000;});
 assert.equal((await call(u,'/outfits/comet/equip','POST',{})).status,200);assert.equal((await state(u)).user.stars,0);
 assert.equal((await call(u,'/outfits/sun/equip','POST',{})).status,200);assert.equal((await call(u,'/outfits/comet/equip','POST',{})).status,200);
 const s=await state(u);assert.equal(s.user.stars,0);assert.equal(s.user.level,9);
});

test('category milestones use the confirmed category, independent of room and decorative task icon',async()=>{
 const u=await setup();for(let i=0;i<6;i++)assert.equal((await complete(u,await task(u,{category:'plants',room:'Küche',icon:'sparkles'}))).status,200);
 let s=await state(u);assert.equal(achievement(s,'garden').value,6);assert.equal(achievement(s,'garden').unlocked,true);assert.equal(achievement(s,'kitchen').value,0);
 await complete(u,await task(u,{category:'kitchen',room:'Haushalt',icon:'plant'}));s=await state(u);assert.equal(achievement(s,'garden').value,6);assert.equal(achievement(s,'kitchen').value,1);
});

test('Albert requires five real missions in each of five categories, with child approval and original snapshot correction',async()=>{
 const u=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child};
 await seed(u,h=>{const m=h.members.find((m:any)=>m.id===child);m.career.categories={kitchen:70,bath:5,laundry:5,tidy:5,household:4,plants:1};});
 const id=await task(u,{assignedTo:child,approvalForChildren:true}),pending=await complete(u,id,headers);assert.equal(pending.body.pending,true);
 let s=await state(u,headers);assert.equal(achievement(s,'albert-reinstein').value,4);assert.equal(achievement(s,'albert-reinstein').unlocked,false);assert.match(achievementHint(achievement(s,'albert-reinstein')),/1 weitere Kategorie mit je 5 Missionen/);
 const current=(await state(u)).tasks.find((t:any)=>t.id===id);assert.equal((await call(u,`/tasks/${id}`,'PATCH',{...current,category:'plants',icon:'plant'})).status,200);
 const approved=await call(u,`/completions/${pending.body.id}/approve`,'POST',{});assert.equal(approved.status,200);assert.ok(approved.body.unlocks.some((x:any)=>x.userId===child&&x.achievementIds.includes('albert-reinstein')));
 s=await state(u,headers);assert.equal(achievement(s,'albert-reinstein').value,5);assert.equal(s.game.categoryProgress.find((c:any)=>c.id==='household').count,5);assert.equal(s.game.categoryProgress.find((c:any)=>c.id==='plants').count,1);
 assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:'albert-reinstein'},headers)).status,200);
 assert.equal((await call(u,`/completions/${s.tasks.find((t:any)=>t.id===id).completion.id}/undo`,'POST',{})).status,200);
 s=await state(u,headers);assert.equal(achievement(s,'albert-reinstein').value,4);assert.equal(achievement(s,'albert-reinstein').unlocked,true);assert.equal(s.user.patchId,'albert-reinstein');assert.equal(achievement(await state(u),'albert-reinstein').value,0);
});

test('station rebalance preserves exactly the modules earned under 0.11 and persists once',async()=>{
 for(const [wins,stage,targets] of [[4,3,[1,2,3,6,9,14]],[5,4,[1,2,3,5,9,14]],[8,5,[1,2,3,5,8,14]],[12,6,[1,2,3,5,8,12]]] as const){
  const u=await setup();await seed(u,h=>{historicalWeeks(h,wins);delete h.game.legacyStationStage;h.members[0].stars=17;h.members[0].xp=333;});
  const s=await state(u);assert.equal(s.game.station.stage,stage);assert.deepEqual(s.game.station.modules.map((m:any)=>m.wins),targets);assert.equal((await raw(u)).game.legacyStationStage,stage);assert.equal(s.user.stars,17);assert.equal(s.user.xp,333);
  const revision=(await repo.forAccount(u))!.revision;await state(u);assert.equal((await repo.forAccount(u))!.revision,revision);
 }
 const u=await setup();await seed(u,h=>historicalWeeks(h,5));assert.equal((await state(u)).game.station.stage,3);await seed(u,h=>historicalWeeks(h,6));assert.equal((await state(u)).game.station.stage,4);
});

test('a real correction still removes an unearned legacy station module after its migration',async()=>{
 const u=await setup(),id=await task(u);await seed(u,h=>{historicalWeeks(h,4);h.game.weeks[weekKey(now)]={key:weekKey(now),count:0,goal:1,quest:null};});
 const done=await complete(u,id);assert.equal(done.status,200);
 await seed(u,h=>{delete h.game.legacyStationStage;});let s=await state(u);assert.equal(s.game.station.wins,5);assert.equal(s.game.station.stage,4);assert.equal(s.game.station.modules.find((m:any)=>m.id==='workshop').wins,5);
 assert.equal((await call(u,`/completions/${done.body.id}/undo`,'POST',{})).status,200);s=await state(u);assert.equal(s.game.station.wins,4);assert.equal(s.game.station.stage,3);
 await complete(u,id);s=await state(u);assert.equal(s.game.station.stage,4);assert.equal(s.game.station.modules.find((m:any)=>m.id==='solar').wins,9);
});

test('new badges and legacy station thresholds survive backups; pre-0.12 backups migrate and invalid stages fail',async()=>{
 const u=await setup();await seed(u,h=>{historicalWeeks(h,8);delete h.game.legacyStationStage;h.members[0].completedCount=75;});await state(u);
 assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:'harry-putzer'})).status,200);
 let backup=(await call(u,'/backups')).body;assert.equal(backup.payload.crew.game.legacyStationStage,5);
 async function restore(b:any){const headers={'X-Putzonaut-Epoch':(await state(u)).restoreEpoch};const p=await call(u,'/backups/preview','POST',{backup:b},headers);assert.equal(p.status,200);assert.equal((await call(u,'/backups/restore','POST',{backup:b,expectedRevision:p.body.expectedRevision,confirmation:'Testcrew'},headers)).status,200);}
 await restore(backup);let s=await state(u);assert.equal(s.user.patchId,'harry-putzer');assert.equal(s.game.station.modules.find((m:any)=>m.id==='solar').wins,8);assert.equal(s.game.station.modules.find((m:any)=>m.id==='dock').wins,14);
 backup=(await call(u,'/backups')).body;delete backup.payload.crew.game.legacyStationStage;let {checksum:_,...data}=backup;backup.checksum=await digest(JSON.stringify(data));await restore(backup);s=await state(u);assert.equal(s.game.station.stage,5);assert.equal((await raw(u)).game.legacyStationStage,5);
 for(const bad of [-1,7,1.5]){const invalid=(await call(u,'/backups')).body;invalid.payload.crew.game.legacyStationStage=bad;const {checksum:__,...content}=invalid;invalid.checksum=await digest(JSON.stringify(content));assert.equal((await call(u,'/backups/preview','POST',{backup:invalid},{'X-Putzonaut-Epoch':(await state(u)).restoreEpoch})).status,400);}
});
