import test from 'node:test';
import assert from 'node:assert/strict';
import {plan} from '../shared/planning.ts';
import {createWeekPlan} from '../shared/workspace.ts';
import {newerVersion,postponeDates,updateBlockReason} from '../shared/flexibility.ts';
import {applyAvailableUpdate} from '../src/app-update.ts';

test('postponing a daily round merges intervening dates, preserves the key and resumes the cadence',()=>{
 const task={id:'t',cadence:'daily',createdOn:'2026-10-29',postponement:{occurrenceKey:'2026-10-29',from:'2026-10-29',until:'2026-11-01'}};
 for(const day of ['2026-10-29','2026-10-30','2026-10-31']){const p=plan(task,day,task.createdOn);assert.equal(p.status,'upcoming');assert.equal(p.nextDueDate,'2026-11-01');assert.equal(p.occurrenceKey,'2026-10-29');}
 assert.equal(plan(task,'2026-11-01',task.createdOn).status,'today');
 const week=createWeekPlan([task],'2026-10-29',task.createdOn,[]);
 assert.deepEqual(week.days.flatMap(d=>d.rounds.map(r=>[d.date,r.occurrenceKey])),[['2026-11-01','2026-10-29'],['2026-11-02','2026-11-02'],['2026-11-03','2026-11-03'],['2026-11-04','2026-11-04']]);
 const done={...task,completion:{occurrenceKey:'2026-10-29',status:'approved',created_at:'2026-11-01T12:00:00Z'}};
 assert.equal(plan(done,'2026-11-01',task.createdOn).status,'done');assert.equal(plan(done,'2026-11-02',task.createdOn).status,'today');
});
test('weekly, monthly, interval and weekday schedules keep their original recurrence after moving one round',()=>{
 const cases=[
  {cadence:'weekly',start:'2026-10-26',key:'2026-10-26',until:'2026-11-07',resume:'2026-11-09'},
  {cadence:'monthly',start:'2026-01-31',key:'2026-01-31',until:'2026-03-03',resume:'2026-03-31',schedule:{monthDay:31}},
  {cadence:'interval',start:'2026-10-26',key:'2026-10-26',until:'2026-11-10',resume:'2026-11-23',schedule:{startDate:'2026-10-26',intervalWeeks:2}},
  {cadence:'weekdays',start:'2026-10-26',key:'2026-10-26',until:'2026-10-30',resume:'2026-11-02',schedule:{weekdays:[1,3]}}
 ];
 for(const c of cases){const t={cadence:c.cadence,createdOn:c.start,schedule:c.schedule,postponement:{occurrenceKey:c.key,from:c.key,until:c.until}};assert.equal(plan(t,c.until,c.start).occurrenceKey,c.key);assert.equal(plan(t,c.until,c.start).nextDueDate,c.resume);assert.equal(plan(t,c.resume,c.start).occurrenceKey,c.resume);}
});
test('once and completion-relative tasks preserve approval and undo semantics',()=>{
 const move={occurrenceKey:'once',from:'2026-10-29',until:'2026-11-01'};
 const once={cadence:'once',createdOn:'2026-10-29',postponement:move};assert.equal(plan(once,'2026-11-03','2026-10-29').status,'overdue');assert.equal(plan(once,'2026-11-03','2026-10-29').nextDueDate,null);
 const t={cadence:'after',schedule:{startDate:'2026-10-29',intervalDays:14},postponement:{...move,occurrenceKey:'2026-10-29'}};
 assert.equal(plan({...t,completion:{occurrenceKey:'2026-10-29',status:'pending',created_at:'2026-11-01T12:00:00Z'}},'2026-11-10','2026-10-29').status,'pending');
 assert.equal(plan({...t,completion:{occurrenceKey:'2026-10-29',status:'approved',created_at:'2026-11-03T12:00:00Z'}},'2026-11-03','2026-10-29').nextDueDate,'2026-11-17');
 assert.equal(plan({...t,reopenedDue:'2026-11-17'},'2026-11-18','2026-10-29').occurrenceKey,'2026-11-17');
});
test('pauses covering a moved recurring date do not revive it afterwards',()=>{
 const t={cadence:'weekly',createdOn:'2026-10-26',postponement:{occurrenceKey:'2026-10-26',from:'2026-11-01',until:'2026-11-04'},pause:{from:'2026-11-02',until:'2026-11-05'}};
 assert.equal(plan(t,'2026-11-04','2026-10-26').status,'paused');assert.equal(plan(t,'2026-11-06','2026-10-26').status,'upcoming');assert.equal(plan(t,'2026-11-09','2026-10-26').occurrenceKey,'2026-11-09');
});
test('date shortcuts use tomorrow on Saturday, next Saturday on Sunday and cross year boundaries',()=>{
 assert.equal(postponeDates('2026-10-30').weekend,'2026-10-31');assert.equal(postponeDates('2026-10-31').weekend,'2026-11-01');assert.equal(postponeDates('2026-11-01').weekend,'2026-11-07');assert.equal(postponeDates('2026-12-31').tomorrow,'2027-01-01');
});
test('release detection compares version numbers and rejects foreign, malformed or stale manifests',()=>{
 for(const value of [null,{}, {app:'other',version:'0.21.0'},{app:'putzonaut',version:'0.2.0'},{app:'putzonaut',version:'0.20.0'},{app:'putzonaut',version:'<script>'}])assert.equal(newerVersion('0.20.0',value),null);
 assert.equal(newerVersion('0.19.4',{app:'putzonaut',version:'0.20.0'}),'0.20.0');assert.equal(newerVersion('0.9.0',{app:'putzonaut',version:'0.10.0'}),'0.10.0');
});
test('update is blocked for open inputs, ongoing rounds, writes, offline and queued completions',async()=>{
 const base={offline:false,busy:false,dialog:false,round:false,queued:0};
 for(const extra of [{offline:true},{busy:true},{dialog:true},{round:true},{queued:1}]){let touched=false;await assert.rejects(applyAvailableUpdate('0.21.0',{blocked:()=>updateBlockReason({...base,...extra}),latest:async()=>{touched=true;return {};},prepare:async()=>{touched=true;},reload:()=>{touched=true;}}));assert.equal(touched,false);}
});
test('update rechecks open inputs after network waits and never reloads other contexts',async()=>{
 let blocked='',prepared=0,reloads=0;
 await assert.rejects(applyAvailableUpdate('0.21.0',{blocked:()=>blocked,latest:async()=>{blocked='Formular offen';return {app:'putzonaut',version:'0.21.0'};},prepare:async()=>{prepared++;},reload:()=>{reloads++;}}),/Formular/);assert.equal(prepared,0);
 blocked='';await assert.rejects(applyAvailableUpdate('0.21.0',{blocked:()=>blocked,latest:async()=>({app:'putzonaut',version:'0.21.0'}),prepare:async()=>{prepared++;blocked='Runde gestartet';},reload:()=>{reloads++;}}),/Runde/);assert.equal(reloads,0);
 blocked='';await applyAvailableUpdate('0.21.0',{blocked:()=>blocked,latest:async()=>({app:'putzonaut',version:'0.21.0'}),prepare:async()=>{prepared++;},reload:()=>{reloads++;}});assert.equal(reloads,1);
 await assert.rejects(applyAvailableUpdate('0.21.0',{blocked:()=>'',latest:async()=>({app:'putzonaut',version:'0.20.0'}),prepare:async()=>assert.fail(),reload:()=>assert.fail()}),/Stand/);
});
