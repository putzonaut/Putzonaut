import test from 'node:test';
import assert from 'node:assert/strict';
import {plan,assignment,localDay,weekKey,validDay,addDays} from '../shared/planning.ts';
const fallback='2026-10-01';
test('selected weekdays advance one round at a time and keep the latest missed round overdue',()=>{
 const t={cadence:'weekdays',schedule:{startDate:'2026-10-29',weekdays:[1,5]}};
 assert.equal(plan(t,'2026-10-29',fallback).status,'upcoming');assert.equal(plan(t,'2026-10-29',fallback).nextDueDate,'2026-10-30');
 assert.equal(plan(t,'2026-10-31',fallback).occurrenceKey,'2026-10-30');assert.equal(plan(t,'2026-10-31',fallback).status,'overdue');
 assert.equal(plan(t,'2026-11-02',fallback).occurrenceKey,'2026-11-02');assert.equal(plan(t,'2026-11-02',fallback).status,'today');
 assert.equal(plan({...t,completion:{occurrenceKey:'2026-11-02'}},'2026-11-02',fallback).status,'done');
});
test('interval weeks stay anchored across years and are unavailable before the start',()=>{
 const t={cadence:'interval',schedule:{startDate:'2026-12-28',intervalWeeks:2}};
 assert.equal(plan(t,'2026-12-27',fallback).status,'upcoming');assert.equal(plan(t,'2026-12-27',fallback).nextDueDate,'2026-12-28');
 assert.equal(plan(t,'2027-01-10',fallback).occurrenceKey,'2026-12-28');assert.equal(plan(t,'2027-01-11',fallback).occurrenceKey,'2027-01-11');
 assert.equal(plan(t,'2027-01-11',fallback).nextDueDate,'2027-01-25');
});
test('monthly schedules clamp month end and return to the original day after February',()=>{
 const t={cadence:'monthly',schedule:{startDate:'2027-01-01',monthDay:31}};
 assert.equal(plan(t,'2027-02-28',fallback).occurrenceKey,'2027-02-28');assert.equal(plan(t,'2027-02-28',fallback).nextDueDate,'2027-03-31');
 assert.equal(plan(t,'2028-02-29',fallback).occurrenceKey,'2028-02-29');assert.equal(plan(t,'2028-04-30',fallback).occurrenceKey,'2028-04-30');
 assert.equal(plan(t,'2027-01-01',fallback).status,'upcoming');
});
test('legacy weekly and daily keys and Berlin DST boundaries remain compatible',()=>{
 assert.equal(plan({cadence:'weekly'},'2026-10-29',fallback).occurrenceKey,'2026-10-26');assert.equal(plan({cadence:'weekly'},'2026-10-29',fallback).effectiveDueDate,'2026-11-01');
 assert.equal(plan({cadence:'daily'},'2026-10-29',fallback).occurrenceKey,'2026-10-29');
 assert.equal(localDay(new Date('2026-03-29T22:30:00Z')),'2026-03-30');assert.equal(weekKey(new Date('2026-10-25T23:30:00Z')),'2026-10-26');assert.equal(addDays('2026-10-25',1),'2026-10-26');
});
test('pauses include their last day, discard missed rounds, and never erase one-off tasks',()=>{
 const t={cadence:'monthly',schedule:{startDate:'2026-01-01',monthDay:15},pause:{from:'2026-10-01',until:'2026-10-30'}};
 assert.equal(plan(t,'2026-10-30',fallback).status,'paused');assert.equal(plan(t,'2026-10-31',fallback).status,'upcoming');assert.equal(plan(t,'2026-10-31',fallback).nextDueDate,'2026-11-15');
 assert.equal(plan({...t,cadence:'once',dueDate:'2026-09-12'},'2026-10-31',fallback).status,'overdue');
 assert.equal(plan({cadence:'once',dueDate:'2026-09-12',createdOn:'2026-10-29'},'2026-10-29',fallback).status,'overdue');
});
test('future and indefinite pauses skip future dates and manual resume has no backlog',()=>{
 const t={cadence:'weekdays',schedule:{weekdays:[1,5]},pause:{from:'2026-10-30',until:'2026-11-03'}};
 assert.equal(plan(t,'2026-10-29',fallback).nextDueDate,'2026-11-06');
 assert.equal(plan({...t,pause:{from:'2026-10-30',until:null}},'2026-10-29',fallback).nextDueDate,null);
 assert.equal(plan({...t,pause:null,skipThrough:'2026-11-02'},'2026-11-03',fallback).status,'upcoming');
 assert.equal(plan({...t,cadence:'daily',pause:null,skipThrough:'2026-11-02'},'2026-11-03',fallback).occurrenceKey,'2026-11-03');
});
test('weekly rotation is calendar-based, stable through DST and skips removed profiles',()=>{
 const t={cadence:'daily',rotationStart:'2026-10-19',rotationIds:['a','b','c']};
 assert.equal(assignment(t,'2026-10-25',['a','b','c']),'a');assert.equal(assignment(t,'2026-10-26',['a','b','c']),'b');assert.equal(assignment(t,'2026-11-02',['a','b','c']),'c');
 assert.equal(assignment(t,'2026-10-26',['a','c']),'c');assert.equal(assignment(t,'2026-10-26',[]),null);
});
test('calendar validation rejects impossible dates and accepts leap days',()=>{assert.equal(validDay('2027-02-29'),false);assert.equal(validDay('2028-02-29'),true);assert.equal(validDay('2026-04-31'),false);assert.equal(validDay('0000-01-01'),false);});
