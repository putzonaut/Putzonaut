/** Calendar arithmetic uses Berlin dates and UTC noon; DST never changes a day count. */
export type Cadence = 'once'|'daily'|'weekly'|'weekdays'|'interval'|'monthly'|'after';
export type Schedule = {startDate?:string;weekdays?:number[];intervalWeeks?:number;monthDay?:number;intervalDays?:number};
export type Pause = {from:string;until:string|null};
export type Postponement = {occurrenceKey:string;from:string;until:string};
export type PlannedTask = {postponement?:Postponement;reopenedDue?:string;breaks?:Pause[];roundAssignment?:{occurrenceKey:string;memberId:string};cadence:string;dueDate?:string|null;schedule?:Schedule;createdOn?:string;pause?:Pause|null;skipThrough?:string|null;rotationIds?:string[];rotationStart?:string;assignedTo?:string|null;completion?:{occurrenceKey:string;status?:string;created_at?:string}|null};
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
export function assignment(t:PlannedTask,day:string,activeIds:string[]){if(t.roundAssignment&&activeIds.includes(t.roundAssignment.memberId)&&plan(t,day,t.createdOn??day).occurrenceKey===t.roundAssignment.occurrenceKey)return t.roundAssignment.memberId;const ids=(t.rotationIds??[]).filter(id=>activeIds.includes(id));if(!ids.length)return t.assignedTo&&activeIds.includes(t.assignedTo)?t.assignedTo:null;const weeks=Math.floor(dayDiff(monday(day),monday(t.rotationStart||t.schedule?.startDate||t.createdOn||day))/7);return ids[((weeks%ids.length)+ids.length)%ids.length];}
function regularPlan(t:PlannedTask,today:string,fallback:string){
 const start=t.schedule?.startDate||t.createdOn||fallback;const lower=t.cadence==='weekly'?monday(start):start;
 const pauses=[t.pause,...(t.breaks??[])].filter((p):p is Pause=>!!p);const paused=pauses.some(p=>isPaused({cadence:t.cadence,pause:p},today));let floor=t.skipThrough||'';for(const p of pauses)if(p.until&&p.until<today&&p.until>floor)floor=p.until;
 if(t.pause?.until&&t.pause.until<today&&t.pause.until>floor)floor=t.pause.until;
 if(t.cadence==='after'){
  // Exactly one open round. The next date is knowable only after confirmation.
  const c=t.completion;
  if(c?.status==='pending')return {occurrenceKey:c.occurrenceKey,status:paused?'paused':'pending',effectiveDueDate:c.occurrenceKey,nextDueDate:null,overdue:false};
  let due=t.reopenedDue||start;
  if(c?.created_at)due=[start,addDays(localDay(new Date(c.created_at)),t.schedule?.intervalDays??14)].sort().at(-1)!;
  if(floor&&due<=floor)due=addDays(floor,1);
  let nextDue=due;
  for(let i=0;i<=pauses.length;i++){const p=pauses.find(p=>nextDue>=p.from&&(!p.until||nextDue<=p.until));if(!p)break;if(!p.until){nextDue='';break;}nextDue=addDays(p.until,1);}
  if(paused)return {occurrenceKey:due<=today?due:'',status:'paused',effectiveDueDate:due<=today?due:null,nextDueDate:nextDue||null,overdue:false};
  due=nextDue||due;
  if(due>today)return {occurrenceKey:c?.occurrenceKey??'',status:c?'done':'upcoming',effectiveDueDate:c?.occurrenceKey??null,nextDueDate:due,overdue:false};
  return {occurrenceKey:due,status:due<today?'overdue':'today',effectiveDueDate:due,nextDueDate:null,overdue:due<today};
 }
 let current=candidate(t,today,start);
 if(current>today||(t.cadence!=='once'&&current<lower)||(t.cadence!=='once'&&current<=floor))current='';
 const key=current?(t.cadence==='once'?'once':current):'';
 const completion=!!key&&t.completion?.occurrenceKey===key?t.completion:null;
 const due=current?(t.cadence==='weekly'?addDays(current,6):current):null;
 let after=today>addDays(lower,-1)?today:addDays(lower,-1);if(floor>after)after=floor;
 let upcoming=next(t,after,start);
 for(let i=0;i<=pauses.length&&upcoming;i++){const blocking=pauses.find(p=>upcoming!>=p.from&&(!p.until||upcoming!<=p.until));if(!blocking)break;upcoming=blocking.until?next(t,blocking.until,start):null;}
 const status=paused?'paused':completion?(completion.status==='pending'?'pending':'done'):current?(due!<today?'overdue':'today'):'upcoming';
 return {occurrenceKey:key,status,effectiveDueDate:due,nextDueDate:upcoming,overdue:status==='overdue'};
}
/** A moved round keeps its identity and occupies the schedule through its target day.
 * Intervening regular dates merge into it; the next regular date resumes the series. */
export function plan(t:PlannedTask,today:string,fallback:string){
 const base=regularPlan(t,today,fallback),move=t.postponement;
 if(!move)return base;
 const start=t.schedule?.startDate||t.createdOn||fallback;
 const pauses=[t.pause,...(t.breaks??[])].filter((p):p is Pause=>!!p);
 const skipped=[t.skipThrough||'',...pauses.flatMap(p=>p.until&&p.until<today?[p.until]:[])].sort().at(-1)!;
 if(t.cadence!=='once'&&move.until<=skipped)return base;
 const completion=t.completion?.occurrenceKey===move.occurrenceKey?t.completion:null;
 if(t.cadence==='after'&&completion&&completion.status!=='pending')return base;
 // Retire an old deferral after a later completion or the next regular date.
 if(t.cadence==='after'&&(t.completion&&t.completion.occurrenceKey>move.occurrenceKey||t.reopenedDue&&t.reopenedDue>move.occurrenceKey))return base;
 const resume=t.cadence==='once'||t.cadence==='after'?null:next(t,move.until,start);
 if(resume&&today>=resume)return base;
 const paused=pauses.some(p=>isPaused({cadence:t.cadence,pause:p},today));
 const status=paused?'paused':completion?(completion.status==='pending'?'pending':'done'):today<move.until?'upcoming':today>move.until?'overdue':'today';
 return {occurrenceKey:move.occurrenceKey,status,effectiveDueDate:move.until,nextDueDate:today<move.until?move.until:resume,overdue:status==='overdue'};
}
export function scheduleLabel(t:PlannedTask){const days=['Mo','Di','Mi','Do','Fr','Sa','So'];switch(t.cadence){case 'after':return `${t.schedule?.intervalDays??14} Tage nach Erledigung`;case 'once':return 'Einmalig';case 'daily':return 'Täglich';case 'weekly':return 'Jede Woche';case 'weekdays':return (t.schedule?.weekdays??[]).map(d=>days[d-1]).join(', ');case 'interval':return `Alle ${t.schedule?.intervalWeeks??2} Wochen`;case 'monthly':return `Monatlich am ${t.schedule?.monthDay??1}.`;default:return '';}}
