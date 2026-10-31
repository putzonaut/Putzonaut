import test from 'node:test';
import assert from 'node:assert/strict';
import {quickCompleteAllowed,dueMissions,completionHighlights,roundMinutes} from '../shared/experience.ts';
import type {CompletionReceipt} from '../shared/experience.ts';
import type {State,Task} from '../src/types.ts';
const task=(id:string,extra:Partial<Task>={}):Task=>({id,title:id,room:'Haushalt',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'daily',occurrenceKey:'2026-10-30',effectiveDueDate:'2026-10-30',nextDueDate:null,status:'today',completion:null,...extra});
const state=():State=>({user:{id:'me',level:2},viewer:{id:'me'},household:{id:'crew'},restoreEpoch:'epoch',game:{station:{modules:[{id:'garden',title:'Pflanzenecke',unlocked:false}]}}} as State);
const receipt:CompletionReceipt={id:'event',createdAt:'2026-10-30T17:00:00Z',title:'Tisch decken',xp:20,stars:5,canUndo:true};
test('direct completion allows own/free due missions but never bypasses a checklist, another owner, team or pause',()=>{
 assert.ok(quickCompleteAllowed(task('free'),'me'));assert.ok(quickCompleteAllowed(task('mine',{effectiveAssignedTo:'me',status:'overdue'}),'me'));
 for(const t of [task('other',{effectiveAssignedTo:'other'}),task('steps',{steps:[{id:'step',title:'Erst prüfen'}]}),task('checked',{checklist:{version:1,occurrenceKey:'2026-10-30',steps:[{id:'s',title:'Prüfen'}],doneIds:['s']}}),task('team',{team:{} as Task['team']}),task('no-round',{occurrenceKey:''}),...(['pending','paused','done','upcoming'] as const).map(status=>task(status,{status}))])assert.equal(quickCompleteAllowed(t,'me'),false,t.id);
 assert.equal(quickCompleteAllowed(task('free'),'me',true),false);
});
test('due list combines today and overdue once, sorts dates and preserves source tasks',()=>{
 const tasks=[task('today'),task('old',{status:'overdue',effectiveDueDate:'2026-10-20'}),task('older',{status:'overdue',effectiveDueDate:'2026-10-10'}),task('pending',{status:'pending'}),task('later',{status:'upcoming'}),task('done',{status:'done'})];const snapshot=JSON.stringify(tasks);
 assert.deepEqual(dueMissions(tasks).map(t=>t.id),['older','old','today']);assert.equal(JSON.stringify(tasks),snapshot);
});
test('ordinary confirmed completions use compact feedback, own level or earned unlocks get a celebration',()=>{
 const before=state(),after=state();assert.equal(completionHighlights(before,after,receipt).special,false);
 after.user.level=3;assert.equal(completionHighlights(before,after,receipt).level,3);
 assert.deepEqual(completionHighlights(before,before,{...receipt,unlocks:[{userId:'me',name:'Alex',achievementIds:['kehrminator']}]}).achievements,['kehrminator']);
 assert.equal(completionHighlights(before,before,{...receipt,unlocks:[{userId:'other',name:'Sam',achievementIds:['kehrminator']}]}).special,false);
});
test('station growth and own quest bonus trigger the larger moment, corrections do not',()=>{
 const before=state(),after=state();after.game.station.modules[0].unlocked=true;
 assert.deepEqual(completionHighlights(before,after,receipt).station,['Pflanzenecke']);assert.equal(completionHighlights(after,before,receipt).special,false);
 const bonus=(userId:string,stars:number)=>({...receipt,bonusChanges:[{userId,name:'Person',stars,week:'2026-10-26'}]});
 assert.equal(completionHighlights(before,before,bonus('me',20)).quest,true);assert.equal(completionHighlights(before,before,bonus('other',20)).special,false);assert.equal(completionHighlights(before,before,bonus('me',-20)).special,false);
});
test('no new milestone is inferred from pending, replayed, stale or unavailable state',()=>{
 const before=state(),after=state();after.user.level=3;
 assert.equal(completionHighlights(before,after,{...receipt,pending:true}).special,false);assert.equal(completionHighlights(before,after,{...receipt,replayed:true}).special,false);assert.equal(completionHighlights(before,null,receipt).special,false);
 for(const change of [(s:State)=>s.user.id='other',(s:State)=>s.viewer.id='other',(s:State)=>s.household.id='other',(s:State)=>s.restoreEpoch='restored']){const s=state();s.user.level=3;change(s);assert.equal(completionHighlights(before,s,receipt).special,false);}
});
test('remembered duration accepts only supported choices and recovers from invalid data',()=>{
 assert.equal(roundMinutes(5),5);assert.equal(roundMinutes(20),20);for(const value of [null,undefined,0,30,'5',{},NaN])assert.equal(roundMinutes(value),10);
});
