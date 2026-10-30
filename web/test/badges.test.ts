import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {REWARD_IDEAS,rewardIdeas} from '../shared/rewards.ts';
import {SPECIAL_BADGES,achievementHint} from '../shared/game.ts';
import {weekKey} from '../shared/planning.ts';

const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-10-30T12:00:00Z');
let mf:Miniflare,repo:Repository;
before(async()=>{
 mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});
 repo=new Repository(await mf.getD1Database('DB'));
 for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
  for(const statement of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(statement.trim())await repo.db.prepare(statement).run();
 }
});
after(async()=>{await mf.dispose();});
async function call(u:string,path:string,method='GET',body?:unknown,headers:Record<string,string>={}){
 const r=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),{userId:u},repo,{now:()=>now});
 return {status:r.status,body:await r.json() as any};
}
async function setup(){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false})).status,201);await state(u);return u;}
async function state(u:string,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,headers);assert.equal(r.status,200);return r.body;}
async function raw(u:string){return JSON.parse((await repo.forAccount(u))!.document);}
async function seed(u:string,fn:(h:any)=>void){const h=await raw(u);fn(h);await repo.db.prepare('UPDATE households SET document=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(h),h.id).run();}
async function task(u:string,category:string,extra:Record<string,unknown>={}){const r=await call(u,'/tasks','POST',{title:'Eine passende Mission',category,room:'Haushalt',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'once',...extra});assert.equal(r.status,200,JSON.stringify(r.body));return r.body.id;}
async function complete(u:string,id:string,headers:Record<string,string>={}){const s=await state(u,headers),t=s.tasks.find((t:any)=>t.id===id);return call(u,`/tasks/${id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version},headers);}
const metric=(s:any,id:string)=>s.game.achievements.find((a:any)=>a.id===id);

for(const a of SPECIAL_BADGES){
 test(`${a.name}: unlock at the exact confirmed threshold, wear for free, retain after correction`,async()=>{
  const u=await setup(),category=a.metric==='kitchenCareer'?'kitchen':['total','weeks'].includes(a.metric)?'pets':a.metric,id=await task(u,category);
  await seed(u,h=>{
   const m=h.members[0];m.stars=70;
   if(a.metric==='total')m.completedCount=a.target-1;
   else if(a.metric==='weeks'){
    m.personalGoal=3;m.weekCount=2;
    for(let i=1;i<a.target;i++)m.career.weeks[weekKey(new Date(now.getTime()-i*14*86400000))]={count:3,goal:3};
   }else m.career.categories[category]=a.target-1;
  });
  let s=await state(u);assert.equal(metric(s,a.id).value,a.target-1);assert.equal(metric(s,a.id).unlocked,false);
  assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:a.id})).status,403);
  assert.equal((await call(u,'/profile/achievement','PATCH',{achievementId:a.id})).status,200);
  const done=await complete(u,id);assert.equal(done.status,200);assert.ok(done.body.unlocks.some((x:any)=>x.achievementIds.includes(a.id)));
  s=await state(u);assert.equal(metric(s,a.id).value,a.target);assert.equal(metric(s,a.id).unlocked,true);assert.equal(s.user.stars,75);
  assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:a.id})).status,200);
  s=await state(u);assert.equal(s.user.patchId,a.id);assert.equal(s.user.patch,a.patch);assert.equal(s.user.stars,75);
  assert.equal((await complete(u,id)).status,409);
  assert.equal((await call(u,`/completions/${done.body.id}/undo`,'POST',{})).status,200);
  s=await state(u);assert.equal(metric(s,a.id).value,a.target-1);assert.equal(metric(s,a.id).unlocked,true);assert.equal(s.user.patchId,a.id);assert.equal(s.user.stars,70);
  assert.equal((await raw(u)).members[0].achievements.filter((x:string)=>x===a.id).length,1);
 });
}

test('eligible 0.8 careers persist all seven retroactive badges once without changing points or wishes',async()=>{
 const u=await setup();await call(u,'/rewards','POST',{title:'Mein eigener Wunsch',cost:123,icon:'gift'});
 await seed(u,h=>{
  const m=h.members[0];m.completedCount=150;m.xp=4000;m.stars=222;
  m.career.categories={tidy:20,kitchen:30,bath:25,household:40,laundry:30};
  for(let i=1;i<=8;i++)m.career.weeks[weekKey(new Date(now.getTime()-i*14*86400000))]={count:3,goal:3};
 });
 const s=await state(u),saved=await raw(u);assert.ok(SPECIAL_BADGES.every(a=>metric(s,a.id).unlocked));
 assert.ok(SPECIAL_BADGES.every(a=>saved.members[0].achievements.includes(a.id)));assert.equal(s.user.xp,4000);assert.equal(s.user.stars,222);assert.equal(s.rewards[0].title,'Mein eigener Wunsch');
 const revision=(await repo.forAccount(u))!.revision;await state(u);assert.equal((await repo.forAccount(u))!.revision,revision);
});

test('child badges count only after approval and cannot be worn through another profile',async()=>{
 const u=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id;
 const id=await task(u,'tidy',{assignedTo:child,approvalForChildren:true});
 await seed(u,h=>{h.members.find((m:any)=>m.id===child).career.categories.tidy=19;});
 const headers={'X-Putzonaut-Profile':child},pending=await complete(u,id,headers);assert.equal(pending.status,200);
 let s=await state(u,headers);assert.equal(metric(s,'franz-beckenkehrer').unlocked,false);assert.equal(metric(s,'franz-beckenkehrer').value,19);
 assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:'franz-beckenkehrer'},headers)).status,403);
 const approved=await call(u,`/completions/${pending.body.id}/approve`,'POST',{});assert.equal(approved.status,200);
 assert.ok(approved.body.unlocks.some((x:any)=>x.userId===child&&x.achievementIds.includes('franz-beckenkehrer')));
 assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:'franz-beckenkehrer'},headers)).status,200);
 assert.equal((await state(u,headers)).user.patchId,'franz-beckenkehrer');assert.equal((await state(u)).user.patchId,null);
 const stranger=await setup();assert.equal((await call(stranger,'/profile/badge','PATCH',{achievementId:'franz-beckenkehrer'},headers)).status,403);
});

test('badge selection keeps title and goal, rejects unknown or non-badge achievements and can be cleared',async()=>{
 const u=await setup();await seed(u,h=>{h.members[0].completedCount=10;});await state(u);
 assert.equal((await call(u,'/profile/game','PATCH',{personalGoal:6,titleId:'steady',patchId:null})).status,200);
 assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:'steady'})).status,200);
 let s=await state(u);assert.equal(s.game.personalGoal.target,6);assert.equal(s.user.titleId,'steady');assert.equal(s.user.patchId,'steady');
 for(const achievementId of ['first','does-not-exist','kehrminator'])assert.equal((await call(u,'/profile/badge','PATCH',{achievementId})).status,403);
 assert.equal((await call(u,'/profile/badge','PATCH',{achievementId:null})).status,200);s=await state(u);assert.equal(s.user.patch,null);assert.equal(s.user.titleId,'steady');
});

test('new badge selection, focus and counters survive a full backup restore',async()=>{
 const u=await setup();await seed(u,h=>{h.members[0].career.categories.tidy=20;});await state(u);
 await call(u,'/profile/badge','PATCH',{achievementId:'franz-beckenkehrer'});await call(u,'/profile/achievement','PATCH',{achievementId:'kehrminator'});
 const backup=(await call(u,'/backups')).body,preview=(await call(u,'/backups/preview','POST',{backup})).body;
 assert.equal((await call(u,'/backups/restore','POST',{backup,expectedRevision:preview.expectedRevision,confirmation:'Testcrew'})).status,200);
 const s=await state(u);assert.equal(s.user.patchId,'franz-beckenkehrer');assert.equal(s.game.focusAchievementId,'kehrminator');assert.equal(metric(s,'franz-beckenkehrer').value,20);assert.equal(metric(s,'franz-beckenkehrer').unlocked,true);
});

test('wish discovery has balanced valid choices for every household, finds words, filters cost and excludes duplicates',()=>{
 for(const kind of ['family','couple','shared','solo'] as const){
  const ideas=REWARD_IDEAS[kind];assert.equal(ideas.length,16);assert.equal(new Set(ideas.map(r=>r.title)).size,16);
  for(const idea of ideas)assert.ok(idea.title.length<=60&&idea.cost>0&&idea.cost<=10000);
  for(const budget of ['small','medium','large'] as const)assert.ok(rewardIdeas(kind,[],'',budget).length>=3);
  assert.equal(rewardIdeas(kind,ideas).length,0);
 }
 assert.ok(rewardIdeas('family',[],'  SPIEL ').every(r=>r.title.toLowerCase().includes('spiel')));
 assert.ok(!rewardIdeas('family',[{title:'  WUNSCHESSEN  '}]).some(r=>r.title==='Wunschessen'));
 assert.ok(rewardIdeas('solo',[],'','small').every(r=>r.cost<=120));assert.ok(rewardIdeas('solo',[],'','medium').every(r=>r.cost>120&&r.cost<=250));assert.ok(rewardIdeas('solo',[],'','large').every(r=>r.cost>250));
 assert.deepEqual(rewardIdeas('family',[],'unauffindbarer Wunsch'),[]);
 assert.match(achievementHint({...SPECIAL_BADGES[0],value:19,unlocked:false}),/1 Aufräummission/);
 assert.match(achievementHint({...SPECIAL_BADGES[2],value:29,unlocked:false}),/1 Küchenmission/);
 assert.match(achievementHint({...SPECIAL_BADGES[5],value:39,unlocked:false}),/1 Mission in der Kategorie Haushalt/);
});
