import test from 'node:test';
import assert from 'node:assert/strict';
import {createWeekPlan,matchesMission} from '../shared/workspace.ts';
import {duplicateDraft,templateDraft} from '../src/drafts.ts';
const base={id:'task',cadence:'daily',createdOn:'2026-10-01',completion:null};
const forecast=(tasks:any[],from='2026-10-29',ids=['alex','sam'])=>createWeekPlan(tasks,from,'2026-10-01',ids);
const entries=(p:ReturnType<typeof forecast>)=>p.days.flatMap(d=>d.rounds.map(r=>({...r,date:d.date})));
test('seven-day forecast lists each recurring round once and overdue one-offs only once',()=>{
 const p=forecast([base,{...base,id:'once',cadence:'once',dueDate:'2026-10-20'},{...base,id:'week',cadence:'weekly'}]);assert.equal(p.days.length,7);const all=entries(p);assert.equal(all.filter(r=>r.taskId==='task').length,7);assert.equal(all.filter(r=>r.taskId==='once').length,1);assert.equal(all.find(r=>r.taskId==='once')!.status,'overdue');const weekly=all.filter(r=>r.taskId==='week');assert.deepEqual(weekly.map(r=>r.date),['2026-10-29','2026-11-02']);assert.equal(weekly[0].dueDate,'2026-11-01');assert.equal(weekly[1].availableNow,false);
});
test('completed rounds are omitted while future repetitions stay visible; pending rounds remain marked',()=>{
 const p=forecast([{...base,completion:{occurrenceKey:'2026-10-29',status:'approved'}},{...base,id:'weekly',cadence:'weekly',completion:{occurrenceKey:'2026-10-26',status:'approved'}},{...base,id:'once',cadence:'once',completion:{occurrenceKey:'once',status:'approved'}},{...base,id:'pending',cadence:'once',completion:{occurrenceKey:'once',status:'pending'}}]);
 const all=entries(p);assert.equal(all.filter(r=>r.taskId==='task').length,6);assert.equal(all.filter(r=>r.taskId==='weekly').length,1);assert.equal(all.filter(r=>r.taskId==='once').length,0);assert.equal(all.find(r=>r.taskId==='pending')!.status,'pending');assert.equal(all.find(r=>r.taskId==='pending')!.availableNow,false);
});
test('forecast respects partial and full pauses without accumulating missed daily rounds',()=>{
 const p=forecast([{...base,pause:{from:'2026-10-29',until:'2026-10-30'}},{...base,id:'off',pause:{from:'2026-10-29',until:null}},{...base,id:'weekly',cadence:'weekly',pause:{from:'2026-10-30',until:'2026-11-01'}}]);const all=entries(p);assert.equal(all.filter(r=>r.taskId==='task').length,5);assert.equal(all.find(r=>r.taskId==='task')!.date,'2026-10-31');assert.equal(all.filter(r=>r.taskId==='off').length,0);assert.deepEqual(all.filter(r=>r.taskId==='weekly').map(r=>r.date),['2026-10-29','2026-11-02']);
});
test('forecast handles month end, leap days and Berlin DST without missing or duplicating days',()=>{
 for(const [from,previous,due] of [['2027-02-27','2027-01-31','2027-02-28'],['2028-02-28','2028-01-31','2028-02-29']]){const p=forecast([{...base,cadence:'monthly',schedule:{startDate:'2026-01-01',monthDay:31},completion:{occurrenceKey:previous,status:'approved'}}],from);assert.deepEqual(entries(p).map(r=>r.date),[due]);}
 const p=forecast([base],'2027-03-26');assert.deepEqual(p.days.map(d=>d.date),['2027-03-26','2027-03-27','2027-03-28','2027-03-29','2027-03-30','2027-03-31','2027-04-01']);assert.equal(entries(p).length,7);
});
test('forecast respects future start dates, selected weekdays and anchored intervals',()=>{
 const p=forecast([{...base,cadence:'interval',schedule:{startDate:'2026-11-02',intervalWeeks:2}},{...base,id:'days',cadence:'weekdays',schedule:{startDate:'2026-10-29',weekdays:[5,7]}}]);assert.deepEqual(entries(p).filter(r=>r.taskId==='task').map(r=>r.date),['2026-11-02']);assert.deepEqual(entries(p).filter(r=>r.taskId==='days').map(r=>r.date),['2026-10-30','2026-11-01']);
});
test('forecast assignments rotate on Monday and ignore removed profiles',()=>{
 const t={...base,rotationIds:['alex','sam'],rotationStart:'2026-10-26'};const p=forecast([t]);assert.equal(p.days[0].rounds[0].assignedTo,'alex');assert.equal(p.days[4].rounds[0].assignedTo,'sam');assert.ok(entries(forecast([t],'2026-10-29',['alex'])).every(r=>r.assignedTo==='alex'));
});
test('mission search includes area and step text and tolerates case, accents and German sharp s',()=>{
 const t={title:'Straße kehren',room:'Außenbereich',steps:[{title:'Blätter sammeln'}]};assert.ok(matchesMission(t,'STRASSE'));assert.ok(matchesMission(t,'blatter aussen'));assert.ok(matchesMission(t,'  '));assert.equal(matchesMission(t,'Bücher'),false);
});
test('duplicates carry only editable task settings and get fresh steps, dates and responsibility',()=>{
 const t:any={id:'old',title:'X'.repeat(80),room:'Balkon',areaId:'area',icon:'plant',minutes:10,xp:40,stars:15,difficulty:'hard',cadence:'interval',schedule:{startDate:'2026-01-01',intervalWeeks:2},assignedTo:'alex',rotationIds:['alex','sam'],pause:{from:'2026-01-01',until:null},completion:{id:'event'},steps:[{id:'old-step',title:'Gießen'}],checklist:{doneIds:['old-step']},approvalForChildren:true};const copy=duplicateDraft(t,'2026-11-02');assert.equal(copy.title!.length,80);assert.equal(copy.schedule!.startDate,'2026-11-02');assert.equal(copy.schedule!.intervalWeeks,2);assert.equal(copy.assignedTo,null);assert.deepEqual(copy.rotationIds,[]);assert.deepEqual(copy.steps,[{title:'Gießen'}]);assert.equal('id' in copy,false);assert.equal('completion' in copy,false);assert.equal('pause' in copy,false);assert.equal('checklist' in copy,false);assert.equal(copy.approvalForChildren,true);assert.equal(copy.areaId,'area');
 const once=duplicateDraft({...t,cadence:'once',dueDate:'2026-01-01'},'2026-11-02');assert.equal(once.dueDate,'2026-11-02');
});
test('all existing templates can be reopened as editable drafts without fabricated progress',()=>{
 for(const key of ['vacuum','dishes','laundry','plant','bath','trash']){const d=templateDraft(key);assert.ok(d.title);assert.ok(d.minutes!>0);assert.equal('id' in d,false);assert.equal('completion' in d,false);assert.deepEqual(d.steps,[]);}
});
