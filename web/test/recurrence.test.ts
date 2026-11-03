import test from 'node:test';
import assert from 'node:assert/strict';
import {addDays,calendarScheduleError,localDay,plan,scheduleLabel} from '../shared/planning.ts';
import type {PlannedTask} from '../shared/planning.ts';
import {formSchedule,initialRecurrence,recurrencePreview} from '../shared/recurrence-form.ts';
import {parseTaskDraft} from '../shared/task-draft.ts';
import {duplicateDraft} from '../src/drafts.ts';
import type {Task} from '../src/types.ts';
import type {TaskFormSnapshot} from '../shared/task-draft.ts';
const fallback='2026-10-01';
const months=(startDate:string,intervalMonths=3):PlannedTask=>({cadence:'monthly-interval',schedule:{startDate,intervalMonths}});
const yearly=(startDate:string):PlannedTask=>({cadence:'yearly',schedule:{startDate}});
const ordinal=(monthWeek:number,monthWeekday:number,startDate='2026-01-01'):PlannedTask=>({cadence:'monthly-weekday',schedule:{startDate,monthWeek,monthWeekday}});

test('month intervals remain anchored to the original month and day across short months and years',()=>{
 for(const [period,start,dates] of [
  [2,'2026-12-31',['2027-02-28','2027-04-30','2027-06-30','2027-08-31']],
  [3,'2026-11-30',['2027-02-28','2027-05-30','2027-08-30','2027-11-30']],
  [6,'2027-08-31',['2028-02-29','2028-08-31','2029-02-28','2029-08-31']],
 ] as const){
  const t=months(start,period);assert.equal(plan(t,addDays(start,-1),fallback).nextDueDate,start);
  let previous:string=start;
  for(const day of dates){assert.equal(plan(t,previous,fallback).nextDueDate,day);assert.equal(plan(t,day,fallback).occurrenceKey,day);previous=day;}
 }
 const t=months('2026-11-30');assert.equal(plan(t,'2026-10-01',fallback).status,'upcoming');
 assert.equal(plan(t,'2027-03-10',fallback).occurrenceKey,'2027-02-28');
 assert.equal(plan(t,'2027-03-10',fallback).status,'overdue');
 assert.equal(plan({...t,completion:{occurrenceKey:'2027-02-28'}},'2027-03-10',fallback).status,'done');
});

test('yearly dates retain their month and day, clamp leap day and return to February 29 in leap years',()=>{
 const t=yearly('2024-02-29');
 for(const [current,next] of [['2026-02-28','2027-02-28'],['2027-02-28','2028-02-29'],['2028-02-29','2029-02-28']]){
  assert.equal(plan(t,current,fallback).occurrenceKey,current);assert.equal(plan(t,current,fallback).nextDueDate,next);
 }
 assert.equal(plan(yearly('2028-02-29'),'2027-06-01',fallback).nextDueDate,'2028-02-29');
 assert.equal(plan(yearly('2026-12-31'),'2027-12-31',fallback).nextDueDate,'2028-12-31');
 assert.equal(plan(yearly('2026-03-15'),'2027-03-14',fallback).occurrenceKey,'2026-03-15');
});

test('first through fourth and last weekdays match an independent calendar across month lengths and leap years',()=>{
 for(const year of [2000,2019,2020,2026,2027,2028,2032,2096,2099])for(let month=0;month<12;month++)for(let day=1;day<=7;day++){
  const matches:string[]=[];
  for(let date=1;date<=31;date++){const d=new Date(Date.UTC(year,month,date,12));if(d.getUTCMonth()===month&&(d.getUTCDay()+6)%7+1===day)matches.push(d.toISOString().slice(0,10));}
  for(const position of [1,2,3,4,-1]){
   const expected=position===-1?matches.at(-1)!:matches[position-1];
   const t=ordinal(position,day,'2000-01-01');
   assert.equal(plan(t,expected,fallback).occurrenceKey,expected);
   assert.equal(plan(t,addDays(expected,-1),fallback).nextDueDate,expected);
   assert.ok(plan(t,expected,fallback).nextDueDate!>expected);
  }
 }
 assert.equal(plan(ordinal(1,6,'2026-11-03'),'2026-11-03',fallback).nextDueDate,'2026-11-07');
 assert.equal(plan(ordinal(-1,7),'2026-11-29',fallback).nextDueDate,'2026-12-27');
});

test('calendar recurrences honor inclusive pauses and resume at the next anchored date without backlog',()=>{
 const t={...months('2026-11-30'),pause:{from:'2027-02-01',until:'2027-03-31'}};
 assert.equal(plan(t,'2027-03-31',fallback).status,'paused');
 assert.equal(plan(t,'2027-04-01',fallback).status,'upcoming');assert.equal(plan(t,'2027-04-01',fallback).nextDueDate,'2027-05-30');
 assert.equal(plan({...t,pause:{from:'2027-02-01',until:null}},'2027-04-01',fallback).nextDueDate,null);
 assert.equal(plan({...ordinal(-1,7),skipThrough:'2026-11-29'},'2026-11-30',fallback).nextDueDate,'2026-12-27');
 assert.equal(plan({...yearly('2024-02-29'),pause:{from:'2027-01-01',until:'2028-03-01'}},'2028-03-02',fallback).nextDueDate,'2029-02-28');
});

test('postponed calendar rounds keep their identity and resume the original series after intervening dates',()=>{
 const t={...ordinal(1,6),postponement:{occurrenceKey:'2026-11-07',from:'2026-11-07',until:'2026-12-20'}};
 assert.equal(plan(t,'2026-12-05',fallback).occurrenceKey,'2026-11-07');assert.equal(plan(t,'2026-12-05',fallback).status,'upcoming');
 assert.equal(plan(t,'2026-12-20',fallback).nextDueDate,'2027-01-02');
 assert.equal(plan({...t,completion:{occurrenceKey:'2026-11-07'}},'2026-12-27',fallback).status,'done');
 assert.equal(plan(t,'2027-01-02',fallback).occurrenceKey,'2027-01-02');
 const lastSunday=ordinal(-1,7);
 assert.equal(plan(lastSunday,localDay(new Date('2026-03-28T23:30:00Z')),fallback).occurrenceKey,'2026-03-29');
 assert.equal(plan(lastSunday,localDay(new Date('2026-10-24T22:30:00Z')),fallback).occurrenceKey,'2026-10-25');
});

test('labels and shared validation clearly describe only supported calendar choices',()=>{
 assert.equal(scheduleLabel(months('2026-11-30')),'Alle 3 Monate am 30.');
 assert.equal(scheduleLabel(yearly('2024-02-29')),'Jährlich am 29. Februar');
 assert.equal(scheduleLabel(ordinal(1,6)),'Jeden ersten Samstag im Monat');
 assert.equal(scheduleLabel(ordinal(-1,7)),'Jeden letzten Sonntag im Monat');
 for(const t of [months('2026-11-30'),yearly('2024-02-29'),ordinal(4,1)])assert.equal(calendarScheduleError(t),null);
 for(const t of [months('2026-11-31'),months('2026-11-30',4),yearly('2027-02-29'),{cadence:'yearly'},ordinal(5,1),ordinal(1,0)])assert.ok(calendarScheduleError(t));
});

test('form values and resumable drafts preserve new recurrence fields and omit irrelevant schedule fields',()=>{
 const today='2026-11-03',values=initialRecurrence(months('2026-11-30'),{intervalMonths:'6',monthWeek:'-1',monthWeekday:'7'},today);
 assert.deepEqual(formSchedule('monthly-interval',values,[]),{startDate:'2026-11-30',intervalMonths:6});
 assert.deepEqual(formSchedule('monthly-weekday',values,[]),{startDate:'2026-11-30',monthWeek:-1,monthWeekday:7});
 assert.deepEqual(formSchedule('yearly',values,[]),{startDate:'2026-11-30'});
 const snapshot:TaskFormSnapshot={fields:values,steps:[],cadence:'monthly-weekday',rotating:false,rotation:[],rotationMode:'weekly',minutes:'10',xp:'40',stars:'15',difficulty:'normal',autoPoints:true,days:[1],detailsOpen:false};
 const saved={version:1,updatedAt:Date.now(),revision:null,snapshot};
 assert.deepEqual(parseTaskDraft(saved)?.snapshot.fields,values);
 assert.equal(parseTaskDraft({...saved,snapshot:{...snapshot,cadence:'unsupported'}}),null);
 assert.deepEqual(initialRecurrence(undefined,{startDate:''},today).startDate,'');
});

test('form previews distinguish due and completed rounds, editing carry-over, pauses and invalid inputs',()=>{
 const t=months('2026-11-30');
 assert.equal(recurrencePreview(undefined,t.cadence,t.schedule!,'2026-11-03')?.nextDate,'2026-11-30');
 assert.equal(recurrencePreview(undefined,t.cadence,t.schedule!,'2026-11-30')?.nextDate,'2026-11-30');
 assert.equal(recurrencePreview({...t,completion:{occurrenceKey:'2026-11-30'}},t.cadence,t.schedule!,'2026-11-30')?.nextDate,'2027-02-28');
 assert.equal(recurrencePreview(t,t.cadence,t.schedule!,'2026-12-01')?.overdueDate,'2026-11-30');
 const old={cadence:'daily',createdOn:'2026-11-01',completion:{occurrenceKey:'2026-11-30'}};
 assert.equal(recurrencePreview(old,t.cadence,t.schedule!,'2026-11-30')?.nextDate,'2027-02-28');
 assert.equal(recurrencePreview({...t,pause:{from:'2026-11-01',until:null}},t.cadence,t.schedule!,'2026-11-03')?.nextDate,null);
 assert.equal(recurrencePreview(undefined,'yearly',{startDate:''},'2026-11-03'),null);
 const moved={...t,schedule:{intervalMonths:3,startDate:'2026-11-30'},postponement:{occurrenceKey:'2026-11-30',from:'2026-11-30',until:'2026-12-10'}};
 assert.equal(recurrencePreview(moved,t.cadence,t.schedule!,'2026-12-01')?.nextDate,'2026-12-10');
});

test('duplicating calendar tasks preserves the original day and month anchor',()=>{
 for(const rule of [months('2026-11-30'),yearly('2024-02-29')]){const copy=duplicateDraft({...rule,title:'Kalendermission',minutes:10,xp:20,stars:5} as Task,'2026-11-03');assert.deepEqual(copy.schedule,rule.schedule);}
 const copy=duplicateDraft({...ordinal(-1,7),title:'Monatsrunde'} as Task,'2026-11-03');assert.deepEqual(copy.schedule,{startDate:'2026-11-03',monthWeek:-1,monthWeekday:7});
});
