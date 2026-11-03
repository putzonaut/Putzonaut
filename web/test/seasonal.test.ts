import test from 'node:test';
import assert from 'node:assert/strict';
import {addDays,calendarScheduleError,plan,scheduleLabel} from '../shared/planning.ts';
import type {PlannedTask} from '../shared/planning.ts';
import {formSchedule,initialRecurrence,recurrencePreview} from '../shared/recurrence-form.ts';
import {duplicateDraft} from '../src/drafts.ts';
import {parseTaskDraft} from '../shared/task-draft.ts';
import {roomOrder} from '../shared/room-order.ts';
import {roundMissions} from '../shared/rounds.ts';
import {lifeMissions} from '../shared/life.ts';
import {missionReaction} from '../shared/mission-reaction.ts';
const fallback='2026-01-01';
const summer=(cadence='daily',schedule:PlannedTask['schedule']={}):PlannedTask=>({cadence,schedule:{startDate:fallback,activeMonths:[4,5,6,7,8,9],...schedule}});

test('seasonal daily tasks have no winter backlog and resume at the first active day',()=>{
 const t=summer();
 for(const day of ['2026-03-31','2026-10-01','2026-12-31']){
  const p=plan(t,day,fallback);assert.equal(p.status,'upcoming');assert.equal(p.occurrenceKey,'');assert.equal(p.effectiveDueDate,null);
  assert.equal(p.nextDueDate,day<'2026-04-01'?'2026-04-01':'2027-04-01');
 }
 assert.equal(plan(t,'2026-04-01',fallback).occurrenceKey,'2026-04-01');
 assert.equal(plan(t,'2026-09-30',fallback).nextDueDate,'2027-04-01');
});
test('contiguous winter months cross the year while separate seasons discard earlier open rounds',()=>{
 const t=summer('monthly',{monthDay:15,activeMonths:[11,12,1,2]});
 assert.equal(plan(t,'2027-01-01',fallback).occurrenceKey,'2026-12-15');
 assert.equal(plan(t,'2027-03-01',fallback).nextDueDate,'2027-11-15');
 assert.equal(plan(t,'2027-11-01',fallback).occurrenceKey,'');
 const separate=summer('monthly',{monthDay:31,activeMonths:[2,5]});
 assert.equal(plan(separate,'2026-05-02',fallback).occurrenceKey,'');
 assert.equal(plan(separate,'2028-02-29',fallback).occurrenceKey,'2028-02-29');
 assert.equal(plan(separate,'2028-02-29',fallback).nextDueDate,'2028-05-31');
});
test('seasons filter all calendar cadences while preserving their original anchors',()=>{
 const cases:[PlannedTask,string,string][]=[
  [summer('weekly'),'2026-03-31','2026-04-06'],
  [summer('weekdays',{weekdays:[1,5]}),'2026-03-31','2026-04-03'],
  [summer('interval',{startDate:'2026-01-05',intervalWeeks:3}),'2026-03-31','2026-04-20'],
  [summer('monthly',{monthDay:31}),'2026-03-31','2026-04-30'],
  [summer('monthly-interval',{startDate:'2026-01-31',intervalMonths:3}),'2026-09-01','2027-04-30'],
  [summer('monthly-weekday',{monthWeek:-1,monthWeekday:7}),'2026-03-31','2026-04-26'],
  [summer('yearly',{startDate:'2024-02-29',activeMonths:[2]}),'2027-03-01','2028-02-29'],
 ];
 for(const [t,day,next] of cases){assert.equal(plan(t,day,fallback).nextDueDate,next,t.cadence);assert.equal(plan(t,next,fallback).occurrenceKey,next,t.cadence);}
});
test('weekly interval season dates agree with an independent enumeration across two years',()=>{
 const start='2025-01-06',t=summer('interval',{startDate:start,intervalWeeks:7,activeMonths:[2,6,7,12]});
 const expected:string[]=[];
 for(let n=0;n<40;n++){const date=addDays(start,49*n);if([2,6,7,12].includes(Number(date.slice(5,7))))expected.push(date);}
 for(let day='2026-01-01';day<'2028-01-01';day=addDays(day,9))assert.equal(plan(t,day,fallback).nextDueDate,expected.find(d=>d>day),day);
});
test('seasonal pause intersections and old deferrals cannot resurrect a previous season',()=>{
 const t={...summer('monthly',{monthDay:15}),pause:{from:'2026-04-01',until:'2026-06-30'}};
 assert.equal(plan(t,'2026-03-31',fallback).nextDueDate,'2026-07-15');
 assert.equal(plan(t,'2026-07-01',fallback).occurrenceKey,'');
 assert.equal(plan({...t,pause:{from:'2026-04-01',until:null}},'2026-05-01',fallback).nextDueDate,null);
 const after={...summer('after',{intervalDays:14}),postponement:{occurrenceKey:'2026-09-01',from:'2026-09-01',until:'2026-09-15'}};
 assert.equal(plan(after,'2026-10-01',fallback).status,'upcoming');
 assert.equal(plan(after,'2027-04-01',fallback).occurrenceKey,'2027-04-01');
});
test('completion-relative omissions start the next interval without pretending a completion',()=>{
 const t={...summer('after',{intervalDays:14}),omission:{occurrenceKey:'2026-09-20',on:'2026-09-20'},skipThrough:'2026-09-20'};
 assert.equal(plan(t,'2026-09-20',fallback).status,'upcoming');assert.equal(plan(t,'2026-09-20',fallback).nextDueDate,'2027-04-01');
 assert.equal(plan(t,'2027-04-01',fallback).occurrenceKey,'2027-04-01');
 const completed={...t,completion:{occurrenceKey:'2027-04-01',created_at:'2027-04-03T12:00:00Z'}};
 assert.equal(plan(completed,'2027-04-03',fallback).status,'done');assert.equal(plan(completed,'2027-04-03',fallback).nextDueDate,'2027-04-17');
 const older={...t,completion:{occurrenceKey:'2026-08-01',created_at:'2026-08-01T12:00:00Z'}};
 assert.equal(plan(older,'2026-09-20',fallback).status,'upcoming');
});
test('invalid and impossible seasons are rejected while all twelve months preserve existing behavior',()=>{
 for(const activeMonths of [[],[0],[13],[2,2],[1.5]])assert.ok(calendarScheduleError(summer('daily',{activeMonths})));
 assert.ok(calendarScheduleError(summer('once')));
 assert.ok(calendarScheduleError(summer('yearly',{startDate:'2026-01-01'})));
 assert.ok(calendarScheduleError(summer('monthly-interval',{startDate:'2026-01-31',intervalMonths:6,activeMonths:[2,3,6]})));
 assert.equal(calendarScheduleError(summer('monthly-interval',{startDate:'2026-01-31',intervalMonths:6,activeMonths:[7]})),null);
 const original={cadence:'monthly',schedule:{startDate:fallback,monthDay:31}};
 for(const day of ['2026-01-01','2026-03-01','2027-01-01'])assert.deepEqual(plan({...original,schedule:{...original.schedule,activeMonths:Array.from({length:12},(_,i)=>i+1)}},day,fallback),plan(original,day,fallback));
});
test('season fields survive drafts, editing and copies; disabling them restores a normal recurrence',()=>{
 const t=summer('monthly',{monthDay:15}),values=initialRecurrence(t);
 assert.equal(values.seasonEnabled,'on');assert.equal(values.activeMonths,'4,5,6,7,8,9');
 assert.deepEqual(formSchedule(t.cadence,values,[]),t.schedule);
 assert.equal(formSchedule('monthly',{...values,seasonEnabled:''},[]).activeMonths,undefined);
 assert.equal(formSchedule('once',values,[]).activeMonths,undefined);
 assert.equal(recurrencePreview(t,t.cadence,t.schedule!,'2026-10-01')?.nextDate,'2027-04-15');
 assert.equal(recurrencePreview(t,t.cadence,{...t.schedule,activeMonths:[]},'2026-10-01'),null);
 assert.ok(scheduleLabel(t).endsWith('Apr, Mai, Jun, Jul, Aug, Sep'));
 const snapshot={fields:values,steps:[],cadence:'monthly',rotating:false,rotation:[],rotationMode:'weekly',minutes:'5',xp:'20',stars:'5',difficulty:'normal',autoPoints:true,days:[],detailsOpen:false};
 assert.ok(parseTaskDraft({version:1,updatedAt:10,revision:null,snapshot},10));
 assert.deepEqual(duplicateDraft({...t,title:'Garten',minutes:5,xp:20,stars:5,room:'Haushalt',icon:'plant'} as any).schedule?.activeMonths,t.schedule!.activeMonths);
});
test('room grouping is stable, preserves the selected work and treats distinct room IDs separately',()=>{
 const a={id:'a',areaId:'kitchen'},b={id:'b',areaId:'bath'},c={id:'c',areaId:'kitchen'},input=[a,b,c];
 assert.deepEqual(roomOrder(input),[a,c,b]);assert.deepEqual(input,[a,b,c]);
 const sameNames=[{id:1,areaId:'a',room:'Raum'},{id:2,areaId:'b',room:'Raum'},{id:3,areaId:'a',room:'Raum'}];
 assert.deepEqual(roomOrder(sameNames).map(t=>t.id),[1,3,2]);assert.deepEqual(roomOrder([{id:1,room:undefined},{id:2,room:undefined},{id:3,room:undefined}]),[{id:1,room:undefined},{id:2,room:undefined},{id:3,room:undefined}]);
});
test('normal, gentle and visitor rounds group selected rooms without increasing their budget or cap',()=>{
 const tasks=['kitchen','bath','kitchen','hallway'].map((areaId,i)=>({id:String(i),title:'Handtücher richten',areaId,room:areaId,status:'today',occurrenceKey:fallback,effectiveDueDate:fallback,effectiveAssignedTo:null,minutes:2,difficulty:'easy',category:'tidy',steps:[],checklist:{doneIds:[]}})) as any;
 for(const selected of [roundMissions(tasks,{id:'me'},6),...(['normal','gentle','visitors'] as const).map(mode=>lifeMissions(tasks,{id:'me'},6,mode))]){
  assert.deepEqual(selected.map(t=>t.id),['0','2','1']);assert.equal(selected.reduce((n,t)=>n+t.minutes,0),6);
 }
});
test('mission reactions use explicit categories and remain optional for unknown tasks',()=>{
 assert.equal(missionReaction({category:'plants'}),'watering');assert.equal(missionReaction({category:'laundry'}),'sock');assert.equal(missionReaction({category:'bath'}),'shine');assert.equal(missionReaction({icon:'plant'}),'watering');assert.equal(missionReaction({category:'tidy',icon:'plant'}),undefined);assert.equal(missionReaction(),undefined);
});
