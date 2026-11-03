import {calendarScheduleError,localDay,plan,scheduleLabel} from './planning.ts';
import type {PlannedTask,Schedule} from './planning.ts';
export const MORE_CADENCES=['monthly-interval','monthly-weekday','yearly'];
export type RecurrenceValues=Record<'startDate'|'dueDate'|'intervalWeeks'|'intervalDays'|'monthDay'|'intervalMonths'|'monthWeek'|'monthWeekday',string>;
export function initialRecurrence(task?:PlannedTask,saved:Partial<RecurrenceValues>={},today=localDay(new Date())):RecurrenceValues{
 const s=task?.schedule;
 const values:RecurrenceValues={startDate:s?.startDate??task?.createdOn??today,dueDate:task?.dueDate??'',intervalWeeks:String(s?.intervalWeeks??2),intervalDays:String(s?.intervalDays??14),monthDay:String(s?.monthDay??1),intervalMonths:String(s?.intervalMonths??3),monthWeek:String(s?.monthWeek??1),monthWeekday:String(s?.monthWeekday??6)};
 for(const key of Object.keys(values) as (keyof RecurrenceValues)[])if(typeof saved[key]==='string')values[key]=saved[key]!;
 return values;
}
export function formSchedule(cadence:string,v:RecurrenceValues,days:number[]):Schedule{
 return {startDate:v.startDate,...(cadence==='weekdays'?{weekdays:days}:{}),...(cadence==='interval'?{intervalWeeks:Number(v.intervalWeeks)}:{}),...(cadence==='after'?{intervalDays:Number(v.intervalDays)}:{}),...(cadence==='monthly'?{monthDay:Number(v.monthDay)}:{}),...(cadence==='monthly-interval'?{intervalMonths:Number(v.intervalMonths)}:{}),...(cadence==='monthly-weekday'?{monthWeek:Number(v.monthWeek),monthWeekday:Number(v.monthWeekday)}:{})};
}
/** Preview uses the production calendar, including the edit path's completed-round carry-over. */
export function recurrencePreview(source:PlannedTask|undefined,cadence:string,schedule:Schedule,today:string){
 if(!MORE_CADENCES.includes(cadence)||calendarScheduleError({cadence,schedule}))return null;
 const task:PlannedTask={...source,cadence,schedule,dueDate:null};
 const signature=(t:PlannedTask)=>JSON.stringify([t.cadence,Object.entries(t.schedule??{}).sort(([a],[b])=>a.localeCompare(b))]);
 if(source&&signature(source)!==signature(task)){
  delete task.postponement;delete task.reopenedDue;
  const before=plan(source,today,today);
  if(task.completion&&task.completion.occurrenceKey===before.occurrenceKey){
   const current=plan(task,today,today);if(current.occurrenceKey)task.completion={...task.completion,occurrenceKey:current.occurrenceKey};
  }
 }
 const p=plan(task,today,today);
 return {label:scheduleLabel(task),nextDate:p.status==='today'?p.effectiveDueDate:p.nextDueDate,overdueDate:p.status==='overdue'?p.effectiveDueDate:null,paused:p.status==='paused'};
}
