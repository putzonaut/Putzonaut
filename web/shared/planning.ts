/** Calendar arithmetic uses Berlin dates and UTC noon; DST never changes a day count. */
export type Cadence = 'once'|'daily'|'weekly'|'weekdays'|'interval'|'monthly';
export type Schedule = {startDate?:string;weekdays?:number[];intervalWeeks?:number;monthDay?:number};
export type Pause = {from:string;until:string|null};
export type PlannedTask = {cadence:string;dueDate?:string|null;schedule?:Schedule;createdOn?:string;pause?:Pause|null;skipThrough?:string|null;rotationIds?:string[];rotationStart?:string;assignedTo?:string|null;completion?:{occurrenceKey:string;status?:string}|null};
export const dayDate=(day:string)=>new Date(`${day}T12:00:00Z`);
export const iso=(date:Date)=>date.toISOString().slice(0,10);
export function localDay(date:Date){const parts=new Intl.DateTimeFormat('en',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const p=(type:string)=>parts.find(p=>p.type===type)!.value;return `${p('year')}-${p('month')}-${p('day')}`;}
export function validDay(day:string){const d=dayDate(day);return /^20\d{2}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(d.getTime())&&iso(d)===day;}
export function addDays(day:string,n:number){const d=dayDate(day);d.setUTCDate(d.getUTCDate()+n);return iso(d);}
export const dayDiff=(a:string,b:string)=>Math.round((dayDate(a).getTime()-dayDate(b).getTime())/86400000);
export const weekday=(day:string)=>(dayDate(day).getUTCDay()+6)%7+1;
export const monday=(day:string)=>addDays(day,1-weekday(day));
export const weekKey=(date:Date)=>monday(localDay(date));
export const isPaused=(task:PlannedTask,day:string)=>!!task.pause&&task.pause.from<=day&&(!task.pause.until||task.pause.until>=day);
function monthly(day:string,date:number,offset=0){const d=dayDate(day);const first=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+offset,1,12));const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0,12)).getUTCDate();first.setUTCDate(Math.min(date,last));return iso(first);}
/** Latest scheduled date at/before reference; no unbounded day-by-day loops. */
function candidate(t:PlannedTask,reference:string,start:string){
 switch(t.cadence){
  case 'once':return t.dueDate||start;
  case 'weekly':return monday(reference);
  case 'weekdays':{const days=t.schedule?.weekdays??[];for(let i=0;i<7;i++){const d=addDays(reference,-i);if(days.includes(weekday(d)))return d;}return start;}
  case 'interval':{const period=7*(t.schedule?.intervalWeeks??2);return addDays(start,Math.floor(dayDiff(reference,start)/period)*period);}
  case 'monthly':{const date=t.schedule?.monthDay??Number(start.slice(8));const d=monthly(reference,date);return d>reference?monthly(reference,date,-1):d;}
  default:return reference;
 }
}
function next(t:PlannedTask,after:string,start:string):string|null{
 if(t.cadence==='once')return (t.dueDate||start)>after?(t.dueDate||start):null;
 if(t.cadence==='monthly'){const d=monthly(after,t.schedule?.monthDay??Number(start.slice(8)));return d>after?d:monthly(after,t.schedule?.monthDay??Number(start.slice(8)),1);}
 if(t.cadence==='interval'){const n=7*(t.schedule?.intervalWeeks??2);return addDays(start,(Math.floor(dayDiff(after,start)/n)+1)*n);}
 if(t.cadence==='weekly')return addDays(monday(after),7);
 if(t.cadence==='weekdays'){for(let i=1;i<=7;i++){const d=addDays(after,i);if(t.schedule?.weekdays?.includes(weekday(d)))return d;}return null;}
 return addDays(after,1);
}
export function assignment(t:PlannedTask,day:string,activeIds:string[]){const ids=(t.rotationIds??[]).filter(id=>activeIds.includes(id));if(!ids.length)return t.assignedTo&&activeIds.includes(t.assignedTo)?t.assignedTo:null;const weeks=Math.floor(dayDiff(monday(day),monday(t.rotationStart||t.schedule?.startDate||t.createdOn||day))/7);return ids[((weeks%ids.length)+ids.length)%ids.length];}
export function plan(t:PlannedTask,today:string,fallback:string){
 const start=t.schedule?.startDate||t.createdOn||fallback;const lower=t.cadence==='weekly'?monday(start):start;
 const paused=isPaused(t,today);let floor=t.skipThrough||'';
 if(t.pause?.until&&t.pause.until<today&&t.pause.until>floor)floor=t.pause.until;
 let current=candidate(t,today,start);
 if(current>today||(t.cadence!=='once'&&current<lower)||(t.cadence!=='once'&&current<=floor))current='';
 const key=current?(t.cadence==='once'?'once':current):'';
 const completion=!!key&&t.completion?.occurrenceKey===key?t.completion:null;
 const due=current?(t.cadence==='weekly'?addDays(current,6):current):null;
 let after=today>addDays(lower,-1)?today:addDays(lower,-1);if(floor>after)after=floor;
 let upcoming=next(t,after,start);
 if(upcoming&&t.pause&&upcoming>=t.pause.from&&(!t.pause.until||upcoming<=t.pause.until))upcoming=t.pause.until?next(t,t.pause.until,start):null;
 const status=paused?'paused':completion?(completion.status==='pending'?'pending':'done'):current?(due!<today?'overdue':'today'):'upcoming';
 return {occurrenceKey:key,status,effectiveDueDate:due,nextDueDate:upcoming,overdue:status==='overdue'};
}
export function scheduleLabel(t:PlannedTask){const days=['Mo','Di','Mi','Do','Fr','Sa','So'];switch(t.cadence){case 'once':return 'Einmalig';case 'daily':return 'Täglich';case 'weekly':return 'Jede Woche';case 'weekdays':return (t.schedule?.weekdays??[]).map(d=>days[d-1]).join(', ');case 'interval':return `Alle ${t.schedule?.intervalWeeks??2} Wochen`;case 'monthly':return `Monatlich am ${t.schedule?.monthDay??1}.`;default:return '';}}
