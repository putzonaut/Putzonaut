import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmedReward,newStationModules,dayIsClear,dailyFinish} from '../shared/moments.ts';
import type {State,Task} from '../src/types.ts';
import type {Statistics} from '../shared/statistics.ts';
import type {CompletionReceipt} from '../shared/experience.ts';
const make=():State=>({user:{id:'me',stars:25},viewer:{id:'me'},household:{id:'crew'},restoreEpoch:'epoch',revision:4,syncedAt:'2026-10-30T18:00:00Z',life:{paused:false},tasks:[],pendingCompletions:[],game:{station:{modules:[{id:'garden',unlocked:false},{id:'robot',unlocked:false}]}}} as unknown as State);
const receipt:CompletionReceipt={id:'completion',title:'Tisch',createdAt:'2026-10-30T18:00:00Z',xp:20,stars:5,canUndo:true};
const stats=():Statistics=>({householdId:'crew',profileId:'me',restoreEpoch:'epoch',revision:4,generatedAt:'2026-10-30T18:00:00Z',period:{days:7,from:'2026-10-24',to:'2026-10-30'},activity:{unit:'day',points:[{from:'2026-10-29',to:'2026-10-29',count:5,xp:100,stars:25},{from:'2026-10-30',to:'2026-10-30',count:2,xp:40,stars:10}]}} as Statistics);
test('reward flight explains the exact confirmed own balance, including an own quest bonus',()=>{
 const before=make(),after=make();after.user.stars=30;after.revision++;
 assert.deepEqual(confirmedReward(before,after,receipt),{id:receipt.id,scope:'["me","crew","me","epoch"]',from:25,to:30});
 after.user.stars=40;assert.equal(confirmedReward(before,after,receipt),null);
 assert.equal(confirmedReward(before,after,{...receipt,bonusChanges:[{userId:'me',name:'M',stars:10,week:'2026-10-26'},{userId:'other',name:'O',stars:10,week:'2026-10-26'}]})?.to,40);
 before.user.stars=-10;after.user.stars=-5;assert.equal(confirmedReward(before,after,receipt)?.from,-10);
});
test('pending, replayed, stale, missing, mismatched and unexplained balances never animate',()=>{
 const before=make(),after=make();after.user.stars=30;
 for(const r of [{...receipt,pending:true},{...receipt,replayed:true},{...receipt,stars:-5},{...receipt,xp:NaN}])assert.equal(confirmedReward(before,after,r),null);
 assert.equal(confirmedReward(before,null,receipt),null);
 for(const change of [(s:State)=>s.user.id='other',(s:State)=>s.viewer.id='other',(s:State)=>s.household.id='other',(s:State)=>s.restoreEpoch='new',(s:State)=>s.revision=1,(s:State)=>s.user.stars=20]){const next=make();next.user.stars=30;change(next);assert.equal(confirmedReward(before,next,receipt),null);}
});
test('station reveal selects only a newly unlocked module in the same crew and profile',()=>{
 const before=make(),after=make();before.game.station.modules[0].unlocked=true;after.game.station.modules.forEach(m=>m.unlocked=true);
 assert.deepEqual(newStationModules(before,after),['robot']);assert.deepEqual(newStationModules(after,after),[]);assert.deepEqual(newStationModules(after,before),[]);
 after.restoreEpoch='restored';assert.deepEqual(newStationModules(before,after),[]);
});
test('daily finish uses only today’s confirmed totals, with a fresh matching statistics snapshot',()=>{
 const s=make(),data=stats();assert.deepEqual(dailyFinish(s,data,true,0),{from:'2026-10-30',to:'2026-10-30',count:2,xp:40,stars:10});
 for(const change of [(v:Statistics)=>v.profileId='other',(v:Statistics)=>v.householdId='other',(v:Statistics)=>v.restoreEpoch='old',(v:Statistics)=>v.revision--,(v:Statistics)=>v.period.to='2026-10-29',(v:Statistics)=>v.activity.unit='week',(v:Statistics)=>v.activity.points[1].count=0,(v:Statistics)=>v.generatedAt='2026-10-29T18:00:00Z']){const v=stats();change(v);assert.equal(dailyFinish(s,v,true,0),null);}
 assert.equal(dailyFinish(s,null,true,0),null);assert.equal(dailyFinish(s,data,false,0),null);assert.equal(dailyFinish(s,data,true,1),null);
});
test('due free/own/shared work, approvals and time off block the daily finish; other assignments do not',()=>{
 for(const status of ['today','overdue','pending'] as const){for(const effectiveAssignedTo of [null,'me']){const s=make();s.tasks=[{status,effectiveAssignedTo} as Task];assert.equal(dayIsClear(s,true,0),false);}}
 const s=make();s.tasks=[{status:'today',effectiveAssignedTo:'other'} as Task];assert.equal(dayIsClear(s,true,0),true);
 s.tasks[0].team={id:'team',createdBy:'me',occurrenceKey:'day',shares:[{userId:'me',name:'M',confirmed:true,approved:true,needsApproval:false,xp:10,stars:5}]};assert.equal(dayIsClear(s,true,0),false);
 s.tasks=[];s.pendingCompletions=[{userId:'me'} as State['pendingCompletions'][number]];assert.equal(dayIsClear(s,true,0),false);
 s.pendingCompletions=[];s.life.paused=true;assert.equal(dayIsClear(s,true,0),false);
 s.life.paused=false;s.tasks=['done','paused','upcoming'].map(status=>({status,effectiveAssignedTo:'me'}) as Task);assert.equal(dayIsClear(s,true,0),true);
});
test('daily summary respects Berlin midnight and disappears when an undo removes today’s last completion',()=>{
 const s=make(),v=stats();s.syncedAt='2026-10-30T23:05:00Z';assert.equal(dailyFinish(s,v,true,0),null);
 s.syncedAt='2026-10-30T18:00:00Z';s.revision++;assert.equal(dailyFinish(s,v,true,0),null);v.revision=s.revision;v.activity.points=v.activity.points.slice(0,1);assert.equal(dailyFinish(s,v,true,0),null);
});
