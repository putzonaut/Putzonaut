import test from 'node:test';
import assert from 'node:assert/strict';
import {todayOverview,completionWish,missionView,sheetViewport,wishProgressText} from '../shared/comfort-ux.ts';
import {parseTaskDraft,DRAFT_TTL} from '../shared/task-draft.ts';
import type {TaskFormSnapshot,SavedTaskDraft} from '../shared/task-draft.ts';
import {readTaskDraft,saveTaskDraft,clearTaskDraft,clearTaskDrafts} from '../src/task-draft-store.ts';
import {readView,writeView,clearViewMemory} from '../src/view-memory.ts';
import type {State,Task} from '../src/types.ts';
const state=():State=>({viewer:{id:'adult'},user:{id:'adult',stars:180},household:{id:'crew'},restoreEpoch:'epoch',revision:3,life:{paused:false},tasks:[],rewards:[{id:'film',title:'Filmabend',cost:200}],game:{savingGoal:{id:'film',title:'Filmabend',cost:200}}} as unknown as State);
const task=(id:string,extra:Partial<Task>={}):Task=>({id,minutes:5,status:'today',occurrenceKey:'today',...extra} as Task);
const receipt={id:'receipt',xp:20,stars:5};
const snapshot=():TaskFormSnapshot=>({fields:{sentence:'Staubsaugen, jeden Samstag, 10 Minuten',sentenceOpen:'on',title:'Noch unfertig',knowledge:'Hinweis',intervalDays:'',approvalForChildren:'on'},steps:[{title:''}],cadence:'after',rotating:false,rotation:[],rotationMode:'balanced',minutes:'',xp:'33',stars:'7',difficulty:'hard',autoPoints:false,days:[1,5],detailsOpen:true});
test('overview counts actionable own, free and unfinished shared rounds without double counting queued work',()=>{
 const s=state();s.tasks=[task('free'),task('own',{effectiveAssignedTo:'adult',status:'overdue',minutes:10}),task('other',{effectiveAssignedTo:'someone'}),task('queued'),task('future',{status:'upcoming'}),task('pending',{status:'pending'}),task('done',{status:'done'}),task('paused',{status:'paused'}),task('shared',{team:{shares:[{userId:'adult',confirmed:false},{userId:'other',confirmed:false}]} as Task['team']}),task('shared-confirmed',{team:{shares:[{userId:'adult',confirmed:true},{userId:'other',confirmed:false}]} as Task['team']})];
 const copy=structuredClone(s);assert.deepEqual(todayOverview(s,new Set(['queued'])),{count:3,minutes:20});assert.deepEqual(s,copy);s.life.paused=true;assert.deepEqual(todayOverview(s),{count:0,minutes:0});
});
test('wish feedback explains only the confirmed matching own balance and selected goal',()=>{
 const before=state(),after=state();after.user.stars=185;after.revision++;
 assert.deepEqual(completionWish(before,after,receipt),{id:'film',title:'Filmabend',remaining:15});
 assert.equal(wishProgressText(completionWish(before,after,receipt)!), 'Noch 15 Sterne bis „Filmabend“.');
 before.user.stars=198;after.user.stars=203;assert.equal(completionWish(before,after,receipt)?.remaining,0);
 before.user.stars=-10;after.user.stars=-5;assert.equal(completionWish(before,after,receipt)?.remaining,205);
 for(const flags of [{pending:true},{replayed:true}])assert.equal(completionWish(before,after,{...receipt,...flags}),null);
 for(const modify of [(s:State)=>s.user.id='child',(s:State)=>s.viewer.id='foreign',(s:State)=>s.household.id='other',(s:State)=>s.restoreEpoch='restored',(s:State)=>s.revision=1,(s:State)=>s.user.stars=250,(s:State)=>s.game.savingGoal=null,(s:State)=>s.game.savingGoal!.id='new',(s:State)=>s.rewards=[]]){const changed=structuredClone(after);modify(changed);assert.equal(completionWish(before,changed,receipt),null);}
 assert.equal(completionWish(before,null,receipt),null);
});
test('stored mission filters validate unknown values and bound the search text',()=>{
 assert.deepEqual(missionView(null),{area:'',mine:false,bucket:'open',query:'',mode:'list',rooms:false});
 const parsed=missionView({area:33,mine:'true',bucket:'removed',query:'a'.repeat(1000),mode:'old',rooms:true});assert.equal(parsed.query.length,100);assert.equal(parsed.mine,false);assert.equal(parsed.mode,'list');
});
test('drafts preserve incomplete fields, manual rewards, checklist and hidden options',()=>{
 const value:SavedTaskDraft={version:1,updatedAt:Date.now(),revision:null,snapshot:snapshot()};assert.deepEqual(parseTaskDraft(JSON.parse(JSON.stringify(value))),value);
 assert.equal(parseTaskDraft({...value,updatedAt:Date.now()-DRAFT_TTL-1}),null);assert.equal(parseTaskDraft({...value,updatedAt:Date.now()+120000}),null);assert.equal(parseTaskDraft({...value,revision:-1}),null);
 for(const edit of [(s:TaskFormSnapshot)=>s.days=[8],(s:TaskFormSnapshot)=>s.fields.knowledge='x'.repeat(1201),(s:TaskFormSnapshot)=>s.steps=Array(13).fill({title:'x'}),(s:TaskFormSnapshot)=>s.autoPoints='true' as unknown as boolean]){const v=structuredClone(value);edit(v.snapshot);assert.equal(parseTaskDraft(v),null);}
});
test('draft and view caches stay separate by viewer, crew, profile, restore epoch and item',()=>{
 const scope='["adult","crew","child","epoch"]';saveTaskDraft(scope,undefined,null,snapshot());saveTaskDraft(scope,'task',9,snapshot());
 assert.equal(readTaskDraft(scope)?.snapshot.stars,'7');assert.equal(readTaskDraft(scope,'task')?.revision,9);assert.equal(readTaskDraft(scope.replace('child','adult')),null);assert.equal(readTaskDraft(scope.replace('epoch','restored')),null);assert.equal(readTaskDraft(scope,'other'),null);
 writeView(scope,'missions',{query:'Küche'});assert.equal(readView<{query:string}|null>(scope,'missions',null,v=>v as {query:string})?.query,'Küche');assert.equal(readView('other','missions',null,v=>v),null);
 clearTaskDraft(scope);assert.equal(readTaskDraft(scope),null);assert.ok(readTaskDraft(scope,'task'));clearTaskDrafts();assert.equal(readTaskDraft(scope,'task'),null);clearViewMemory();assert.equal(readView(scope,'missions',null,v=>v),null);
});
test('the visible sheet avoids a software keyboard while allowing zoom and normal browser chrome',()=>{
 assert.deepEqual(sheetViewport(850,500,0,1,true),{inset:350,height:500});assert.deepEqual(sheetViewport(850,500,80,1,true),{inset:270,height:500});assert.deepEqual(sheetViewport(500,500,0,1,true),{inset:0,height:500});assert.deepEqual(sheetViewport(850,810,0,1,true),{inset:0,height:810});assert.deepEqual(sheetViewport(850,400,0,2,true),{inset:0,height:850});assert.deepEqual(sheetViewport(850,500,0,1,false),{inset:0,height:500});
});
