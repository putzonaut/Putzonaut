import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {Repository} from '../server/repository.ts';
import {handleApi} from '../server/api.ts';
import {achievementCollections,ACHIEVEMENTS,SPECIAL_BADGES,nextAchievements} from '../shared/game.ts';
import {addDays} from '../shared/planning.ts';

const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-10-30T12:00:00Z');
let mf:Miniflare,repo:Repository;
before(async()=>{mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});repo=new Repository(await mf.getD1Database('DB'));for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(sql.trim())await repo.db.prepare(sql).run();});
after(async()=>{await mf.dispose();});
async function call(u:string,path:string,method='GET',body?:unknown,date=now,headers:Record<string,string>={}){const r=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),u?{userId:u}:null,repo,{now:()=>date});return {status:r.status,body:await r.json() as any,headers:r.headers};}
async function state(u:string,date=now,headers:Record<string,string>={}){const r=await call(u,'/state','GET',undefined,date,headers);assert.equal(r.status,200);return r.body;}
async function setup(){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name:'Alex',householdName:'Testcrew',starterTasks:false})).status,201);await state(u);return u;}
async function raw(u:string){return JSON.parse((await repo.forAccount(u))!.document);}
async function seed(u:string,fn:(h:any)=>void){const h=await raw(u);fn(h);await repo.db.prepare('UPDATE households SET document=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(h),h.id).run();}
async function task(u:string,extra:Record<string,unknown>={}){const r=await call(u,'/tasks','POST',{title:'Eine Mission',category:'tidy',room:'Haushalt',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'once',...extra});assert.equal(r.status,200);return r.body.id;}
async function complete(u:string,id:string,date=now,headers:Record<string,string>={}){const t=(await state(u,date,headers)).tasks.find((t:any)=>t.id===id);return call(u,`/tasks/${id}/complete`,'POST',{occurrenceKey:t.occurrenceKey,checklistVersion:t.checklist.version},date,headers);}
async function stats(u:string,days=30,date=now,headers:Record<string,string>={}){const r=await call(u,`/statistics?days=${days}`,'GET',undefined,date,headers);assert.equal(r.status,200,JSON.stringify(r.body));return r.body;}
async function join(u:string){const invitation=(await call(u,'/invitations','POST',{})).body.token,other=crypto.randomUUID();assert.equal((await call(other,'/auth/join','POST',{name:'Sam',invite:invitation})).status,201);return other;}
async function events(u:string,items:Record<string,unknown>[]){const h=await raw(u),m=h.members.find((m:any)=>m.accountId===u),list=items.map(i=>({id:crypto.randomUUID(),kind:'completion',name:m.name,userId:m.id,title:'Historischer Einsatz',createdAt:now.toISOString(),xp:20,stars:5,category:'tidy',...i}));for(let i=0;i<list.length;i+=50)await repo.db.batch(list.slice(i,i+50).map(e=>repo.db.prepare('INSERT INTO events(id,household_id,member_id,kind,created_at,request_key,payload) VALUES(?,?,?,?,?,?,?)').bind(e.id,h.id,e.userId,e.kind,e.createdAt,(e as any).requestKey??null,JSON.stringify(e))));return list;}

test('the two achievement collections are disjoint, complete and preserve achievements and chosen goals',()=>{
 const items=ACHIEVEMENTS.map(a=>({...a,value:0,unlocked:false,applicable:true})),split=achievementCollections(items);assert.equal(split.milestones.length,12);assert.equal(split.badges.length,7);assert.deepEqual(split.badges.map(a=>a.id),SPECIAL_BADGES.map(a=>a.id));assert.ok(split.milestones.every(a=>!split.badges.some(b=>b.id===a.id)));assert.equal(new Set([...split.milestones,...split.badges].map(a=>a.id)).size,19);assert.equal(nextAchievements(items,'kehrminator')[0].id,'kehrminator');assert.equal(split.badges.find(a=>a.id==='kehrminator'),items.find(a=>a.id==='kehrminator'));
});
test('an empty profile has real zero charts, a current goal and no invented historical targets',async()=>{
 const u=await setup(),before=(await repo.forAccount(u))!.revision,s=await stats(u,7);assert.deepEqual(s.totals,{count:0,xp:0,stars:0,activeDays:0});assert.equal(s.activity.unit,'day');assert.equal(s.activity.points.length,7);assert.equal(s.period.from,'2026-10-24');assert.equal(s.period.to,'2026-10-30');assert.deepEqual(s.categories,[]);assert.equal(s.goals.length,6);assert.ok(s.goals.slice(0,-1).every((w:any)=>w.goal===null));assert.equal(s.goals.at(-1).goal,3);assert.equal((await repo.forAccount(u))!.revision,before);const r=await call(u,'/statistics');assert.equal(r.body.period.days,30);assert.equal(r.headers.get('Cache-Control'),'private, no-store');
});
test('statistics count normal completions once, preserve historical categories and survive task archival',async()=>{
 const u=await setup(),id=await task(u,{category:'kitchen'}),done=await complete(u,id);assert.equal(done.status,200);assert.equal((await complete(u,id)).status,409);
 const t=(await raw(u)).tasks.find((t:any)=>t.id===id);await call(u,`/tasks/${id}`,'PATCH',{...t,title:'Geändert',category:'laundry',stars:50,xp:100});await call(u,`/tasks/${id}`,'DELETE',{});const s=await stats(u);assert.deepEqual(s.totals,{count:1,xp:20,stars:5,activeDays:1});assert.deepEqual(s.categories,[{id:'kitchen',count:1}]);assert.equal(s.activity.points.reduce((n:number,p:any)=>n+p.count,0),1);
});
test('pending child work is excluded and approval counts for the child on the approval date',async()=>{
 const u=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child},id=await task(u,{approvalForChildren:true}),claim=await complete(u,id,now,headers);assert.equal((await stats(u,7,now,headers)).totals.count,0);assert.equal((await stats(u)).totals.count,0);
 const tomorrow=new Date('2026-10-31T12:00:00Z');assert.equal((await call(u,`/completions/${claim.body.id}/approve`,'POST',{},tomorrow)).status,200);const s=await stats(u,7,tomorrow,headers);assert.equal(s.totals.count,1);assert.equal(s.activity.points.at(-1).count,1);assert.equal(s.activity.points.at(-2).count,0);assert.equal(s.profileId,child);assert.equal((await stats(u,7,tomorrow)).totals.count,0);
});
test('later corrections remove the original completion from every statistic without counting as activity',async()=>{
 const u=await setup(),id=await task(u),done=await complete(u,id);const later=new Date('2026-11-03T12:00:00Z');assert.equal((await stats(u,7,later)).totals.count,1);await call(u,`/completions/${done.body.id}/undo`,'POST',{},later);const s=await stats(u,7,later);assert.deepEqual(s.totals,{count:0,xp:0,stars:0,activeDays:0});assert.deepEqual(s.categories,[]);assert.ok(s.activity.points.every((p:any)=>p.count===0));
});
test('mission earnings exclude quest bonuses, spending, deposits and refunds',async()=>{
 const u=await setup(),a=await task(u),b=await task(u),key=(await state(u)).game.station.current.key;assert.equal((await call(u,'/quests','POST',{title:'Kleine Quest',taskIds:[a,b],weekKey:key,repeat:false})).status,200);await complete(u,a);await complete(u,b);assert.equal((await state(u)).user.stars,30);
 const wish=(await call(u,'/crew-wishes','POST',{title:'Gemeinsam feiern',cost:100,icon:'gift',requestKey:crypto.randomUUID()})).body.id;await call(u,`/crew-wishes/${wish}/deposit`,'POST',{amount:20,requestKey:crypto.randomUUID()});await call(u,`/crew-wishes/${wish}/withdraw`,'POST',{amount:10,requestKey:crypto.randomUUID()});const reward=(await call(u,'/rewards','POST',{title:'Eine Pause',cost:5,icon:'gift'})).body.id;await call(u,`/rewards/${reward}/redeem`,'POST',{requestKey:crypto.randomUUID()});const s=await stats(u);assert.deepEqual(s.totals,{count:2,xp:40,stars:10,activeDays:1});assert.equal((await state(u)).user.stars,15);
});
test('Berlin local midnight and the autumn DST hour are grouped into the right days',async()=>{
 const u=await setup();await events(u,[{createdAt:'2026-10-24T21:59:59.000Z'},{createdAt:'2026-10-24T22:00:00.000Z'},{createdAt:'2026-10-25T00:30:00.000Z'},{createdAt:'2026-10-25T01:30:00.000Z'},{createdAt:'2026-10-25T22:59:59.000Z'},{createdAt:'2026-10-25T23:00:00.000Z'}]);const s=await stats(u,7,new Date('2026-10-26T12:00:00Z'));assert.equal(s.totals.count,6);assert.equal(s.totals.activeDays,3);assert.equal(s.activity.points.find((p:any)=>p.from==='2026-10-24').count,1);assert.equal(s.activity.points.find((p:any)=>p.from==='2026-10-25').count,4);assert.equal(s.activity.points.find((p:any)=>p.from==='2026-10-26').count,1);
});
test('spring DST and inclusive seven-day boundaries exclude older and future events',async()=>{
 const u=await setup(),date=new Date('2027-03-29T12:00:00Z');await events(u,[{createdAt:'2027-03-22T22:59:59.000Z'},{createdAt:'2027-03-22T23:00:00.000Z'},{createdAt:'2027-03-28T00:30:00.000Z'},{createdAt:'2027-03-28T01:30:00.000Z'},{createdAt:'2027-03-29T12:00:00.000Z'},{createdAt:'2027-03-29T12:00:01.000Z'}]);const s=await stats(u,7,date);assert.equal(s.totals.count,4);assert.equal(s.period.from,'2027-03-23');assert.equal(s.activity.points.find((p:any)=>p.from==='2027-03-28').count,2);assert.equal(s.totals.activeDays,3);
});
test('30- and 90-day plots preserve exact totals across partial weeks, months and a year boundary',async()=>{
 const u=await setup(),date=new Date('2027-01-04T12:00:00Z'),items=Array.from({length:90},(_,i)=>({createdAt:addDays('2027-01-04',-i)+'T10:00:00.000Z',xp:10,stars:2}));await events(u,items);
 for(const days of [30,90]){const s=await stats(u,days,date);assert.equal(s.totals.count,days);assert.equal(s.totals.activeDays,days);assert.equal(s.activity.unit,days===30?'week':'month');assert.equal(s.activity.points[0].from,s.period.from);assert.equal(s.activity.points.at(-1).to,s.period.to);assert.equal(s.activity.points.reduce((n:number,p:any)=>n+p.count,0),days);assert.equal(s.activity.points.reduce((n:number,p:any)=>n+p.stars,0),days*2);assert.ok(s.activity.points.length<=7);}
});
test('statistics aggregate all matching history beyond the logbook page and retain unknown categories',async()=>{
 const u=await setup();await events(u,Array.from({length:151},(_,i)=>({category:i<100?'kitchen':undefined,icon:i<125?'sparkles':'laundry',room:'Unbekannt',title:'Alte Aufgabe'})));const s=await stats(u);assert.equal((await call(u,'/history')).body.items.length,50);assert.equal(s.totals.count,151);assert.equal(s.totals.xp,3020);assert.equal(s.totals.stars,755);assert.deepEqual(s.categories,[{id:'kitchen',count:100},{id:'laundry',count:26},{id:'unknown',count:25}]);
});
test('weekly goals keep their recorded values and do not infer targets for gaps',async()=>{
 const u=await setup();await seed(u,h=>{h.members[0].career.weeks['2026-10-12']={count:6,goal:5};h.members[0].career.weeks['2026-10-19']={count:2,goal:4};});await call(u,'/profile/game','PATCH',{personalGoal:8,titleId:null,patchId:null});let s=await stats(u);assert.deepEqual(s.goals.find((w:any)=>w.from==='2026-10-12'),{from:'2026-10-12',to:'2026-10-18',count:6,goal:5,current:false});assert.equal(s.goals.find((w:any)=>w.from==='2026-10-19').goal,4);assert.equal(s.goals.at(-1).goal,8);assert.equal(s.goals.find((w:any)=>w.from==='2026-10-05').goal,null);
 s=await stats(u,7,new Date('2026-11-02T12:00:00Z'));assert.equal(s.goals.at(-1).count,0);assert.equal(s.goals.at(-1).goal,8);
});
test('statistics are isolated by crew and profile with the existing child permissions',async()=>{
 const u=await setup(),other=await join(u),stranger=await setup(),child=(await call(u,'/children','POST',{name:'Lio'})).body.id,headers={'X-Putzonaut-Profile':child},a=await task(u),b=await task(u);await complete(u,a);await complete(other,b);assert.equal((await stats(u)).totals.count,1);assert.equal((await stats(other)).totals.count,1);assert.equal((await stats(stranger)).totals.count,0);assert.equal((await stats(u,7,now,headers)).totals.count,0);assert.equal((await call(other,'/statistics','GET',undefined,now,headers)).status,403);assert.equal((await call(stranger,'/statistics','GET',undefined,now,headers)).status,403);assert.equal((await call('','/statistics')).status,401);
});
test('a guardian change between initial authorization and the statistics snapshot denies stale access',async()=>{
 const u=await setup(),other=await join(u),child=(await call(other,'/children','POST',{name:'Lio'})).body.id,admin=(await state(u)).user.id,original=repo.statisticsSnapshot.bind(repo);let changed=false;
 repo.statisticsSnapshot=async(...args)=>{if(!changed){changed=true;assert.equal((await call(u,`/members/${child}`,'PATCH',{name:'Lio',guardianId:admin})).status,200);}return original(...args);};
 try{assert.equal((await call(other,'/statistics','GET',undefined,now,{'X-Putzonaut-Profile':child})).status,403);}finally{repo.statisticsSnapshot=original;}
});
test('restoring a backup immediately restores statistics and returns its new epoch',async()=>{
 const u=await setup(),a=await task(u),b=await task(u);await complete(u,a);const backup=(await call(u,'/backups')).body;await complete(u,b);assert.equal((await stats(u)).totals.count,2);const preview=(await call(u,'/backups/preview','POST',{backup})).body;assert.equal((await call(u,'/backups/restore','POST',{backup,expectedRevision:preview.expectedRevision,confirmation:'Testcrew'})).status,200);const s=await stats(u);assert.equal(s.totals.count,1);assert.ok(s.restoreEpoch);assert.equal(s.restoreEpoch,(await state(u)).restoreEpoch);
});
test('unsupported statistic windows fail validation without changing household state',async()=>{
 const u=await setup(),revision=(await repo.forAccount(u))!.revision;for(const value of ['0','1','-7','365','7.5','NaN','Infinity',''])assert.equal((await call(u,'/statistics?days='+value)).status,400);assert.equal((await repo.forAccount(u))!.revision,revision);
});
