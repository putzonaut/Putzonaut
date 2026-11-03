/** Calendar arithmetic uses Berlin dates and UTC noon; DST never changes a day count. */
export const CADENCES=['once','daily','weekly','weekdays','interval','monthly','after','monthly-interval','monthly-weekday','yearly'] as const;
export type Cadence = typeof CADENCES[number];
export type Schedule = {startDate?:string;weekdays?:number[];intervalWeeks?:number;monthDay?:number;intervalDays?:number;intervalMonths?:number;monthWeek?:number;monthWeekday?:number;activeMonths?:number[]};
export type Pause = {from:string;until:string|null};
export type Postponement = {occurrenceKey:string;from:string;until:string};
export type PlannedTask = {omission?:{occurrenceKey:string;on:string};postponement?:Postponement;reopenedDue?:string;breaks?:Pause[];roundAssignment?:{occurrenceKey:string;memberId:string};cadence:string;dueDate?:string|null;schedule?:Schedule;createdOn?:string;pause?:Pause|null;skipThrough?:string|null;rotationIds?:string[];rotationStart?:string;assignedTo?:string|null;completion?:{occurrenceKey:string;status?:string;created_at?:string}|null};
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
const monthIndex=(day:string)=>Number(day.slice(0,4))*12+Number(day.slice(5,7))-1;
export const MONTH_NAMES=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
export const isSeasonDay=(t:Pick<PlannedTask,'schedule'>,day:string)=>!t.schedule?.activeMonths||t.schedule.activeMonths.includes(Number(day.slice(5,7)));
function nextSeasonDay(t:PlannedTask,day:string):string|null{
 for(let i=0;i<12;i++){if(isSeasonDay(t,day))return day;day=monthly(day,1,1);}return null;
}
/** New seasons begin without unfinished rounds from an earlier season. */
function seasonBoundary(t:PlannedTask,today:string):string|null{
 if(!t.schedule?.activeMonths||t.schedule.activeMonths.length===12)return null;
 if(!isSeasonDay(t,today))return nextSeasonDay(t,today);
 let first=monthly(today,1);
 for(let i=0;i<11;i++){const previous=monthly(first,1,-1);if(!isSeasonDay(t,previous))break;first=previous;}return first;
}
function anchoredMonth(t:PlannedTask,reference:string,start:string){
 const period=t.cadence==='yearly'?12:t.schedule!.intervalMonths!;
 const offset=Math.floor((monthIndex(reference)-monthIndex(start))/period)*period;
 const date=Number(start.slice(8)),due=monthly(start,date,offset);
 return due>reference?monthly(start,date,offset-period):due;
}
function ordinalMonth(t:PlannedTask,reference:string,offset=0){
 const first=monthly(reference,1,offset),wanted=t.schedule!.monthWeekday!,ordinal=t.schedule!.monthWeek!;
 if(ordinal===-1){const last=monthly(reference,31,offset);return addDays(last,-((weekday(last)-wanted+7)%7));}
 return addDays(first,(wanted-weekday(first)+7)%7+(ordinal-1)*7);
}
/** Shared by API writes, backup validation and the form preview. */
export function calendarScheduleError(t:Pick<PlannedTask,'cadence'|'schedule'>):string|null{
 const months=t.schedule?.activeMonths;
 if(months){
  if(t.cadence==='once')return 'Eine Saison gehört zu einer wiederkehrenden Mission.';
  if(!months.length||months.length>12||new Set(months).size!==months.length||months.some(m=>!Number.isInteger(m)||m<1||m>12))return 'Wähle mindestens einen gültigen Monat für die Saison.';
  const start=t.schedule?.startDate;
  if(start&&validDay(start)&&['yearly','monthly-interval'].includes(t.cadence)){
   const period=t.cadence==='yearly'?12:t.schedule?.intervalMonths;
   if(period&&!months.some(m=>(m-Number(start.slice(5,7))+12)%period===0))return 'In diesen Monaten liegt kein Termin des gewählten Rhythmus. Passe den ersten Termin oder die Saison an.';
  }
 }
 if(!['monthly-interval','monthly-weekday','yearly'].includes(t.cadence))return null;
 const s=t.schedule;
 if(!s?.startDate||!validDay(s.startDate))return 'Wähle ein gültiges Startdatum zwischen 2000 und 2099.';
 if(t.cadence==='monthly-interval'&&![2,3,6].includes(s.intervalMonths!))return 'Wähle einen Abstand von zwei, drei oder sechs Monaten.';
 if(t.cadence==='monthly-weekday'&&(![-1,1,2,3,4].includes(s.monthWeek!)||![1,2,3,4,5,6,7].includes(s.monthWeekday!)))return 'Wähle die Position im Monat und einen Wochentag.';
 return null;
}
/** Latest scheduled date at/before reference; no unbounded day-by-day loops. */
function candidate(t:PlannedTask,reference:string,start:string){
 switch(t.cadence){
  case 'once':return t.dueDate||start;
  case 'weekly':return monday(reference);
  case 'weekdays':{const days=t.schedule?.weekdays??[];for(let i=0;i<7;i++){const d=addDays(reference,-i);if(days.includes(weekday(d)))return d;}return start;}
  case 'interval':{const period=7*(t.schedule?.intervalWeeks??2);return addDays(start,Math.floor(dayDiff(reference,start)/period)*period);}
  case 'monthly':{const date=t.schedule?.monthDay??Number(start.slice(8));const d=monthly(reference,date);return d>reference?monthly(reference,date,-1):d;}
  case 'monthly-interval':case 'yearly':return anchoredMonth(t,reference,start);
  case 'monthly-weekday':{const d=ordinalMonth(t,reference);return d>reference?ordinalMonth(t,reference,-1):d;}
  default:return reference;
 }
}
function nextBase(t:PlannedTask,after:string,start:string):string|null{
 if(t.cadence==='once')return (t.dueDate||start)>after?(t.dueDate||start):null;
 if(t.cadence==='monthly'){const d=monthly(after,t.schedule?.monthDay??Number(start.slice(8)));return d>after?d:monthly(after,t.schedule?.monthDay??Number(start.slice(8)),1);}
 if(t.cadence==='monthly-interval'||t.cadence==='yearly'){
  const current=anchoredMonth(t,after,start),period=t.cadence==='yearly'?12:t.schedule!.intervalMonths!;
  return monthly(start,Number(start.slice(8)),monthIndex(current)-monthIndex(start)+period);
 }
 if(t.cadence==='monthly-weekday'){const d=ordinalMonth(t,after);return d>after?d:ordinalMonth(t,after,1);}
 if(t.cadence==='interval'){const n=7*(t.schedule?.intervalWeeks??2);return addDays(start,(Math.floor(dayDiff(after,start)/n)+1)*n);}
 if(t.cadence==='weekly')return addDays(monday(after),7);
 if(t.cadence==='weekdays'){for(let i=1;i<=7;i++){const d=addDays(after,i);if(t.schedule?.weekdays?.includes(weekday(d)))return d;}return null;}
 return addDays(after,1);
}
function next(t:PlannedTask,after:string,start:string):string|null{
 let due=nextBase(t,after,start);
 // Jump over inactive months while retaining the original day/week/month anchor.
 for(let i=0;due&&i<4800;i++){
  if(t.cadence==='once'||isSeasonDay(t,due))return due;
  due=nextBase(t,monthly(due,31),start);
 }
 return null;
}
export function assignment(t:PlannedTask,day:string,activeIds:string[]){if(t.roundAssignment&&activeIds.includes(t.roundAssignment.memberId)&&plan(t,day,t.createdOn??day).occurrenceKey===t.roundAssignment.occurrenceKey)return t.roundAssignment.memberId;const ids=(t.rotationIds??[]).filter(id=>activeIds.includes(id));if(!ids.length)return t.assignedTo&&activeIds.includes(t.assignedTo)?t.assignedTo:null;const weeks=Math.floor(dayDiff(monday(day),monday(t.rotationStart||t.schedule?.startDate||t.createdOn||day))/7);return ids[((weeks%ids.length)+ids.length)%ids.length];}
function regularPlan(t:PlannedTask,today:string,fallback:string){
 const start=t.schedule?.startDate||t.createdOn||fallback;const lower=t.cadence==='weekly'?monday(start):start;
 const pauses=[t.pause,...(t.breaks??[])].filter((p):p is Pause=>!!p);const paused=pauses.some(p=>isPaused({cadence:t.cadence,pause:p},today));let floor=t.skipThrough||'';for(const p of pauses)if(p.until&&p.until<today&&p.until>floor)floor=p.until;
 if(t.pause?.until&&t.pause.until<today&&t.pause.until>floor)floor=t.pause.until;
 const boundary=t.cadence==='once'?null:seasonBoundary(t,today);
 if(boundary&&addDays(boundary,-1)>floor)floor=addDays(boundary,-1);
 if(t.cadence==='after'){
  // Exactly one open round. The next date is knowable only after confirmation.
  const c=t.completion;
  if(c?.status==='pending')return {occurrenceKey:c.occurrenceKey,status:paused?'paused':'pending',effectiveDueDate:c.occurrenceKey,nextDueDate:null,overdue:false};
  let due=t.reopenedDue||start;
  if(c?.created_at)due=[start,addDays(localDay(new Date(c.created_at)),t.schedule?.intervalDays??14)].sort().at(-1)!;
  if(t.omission)due=[due,addDays(t.omission.on,t.schedule?.intervalDays??14)].sort().at(-1)!;
  if(floor&&due<=floor)due=addDays(floor,1);
  let nextDue=nextSeasonDay(t,due)??'';
  for(let i=0;i<=pauses.length&&nextDue;i++){const p=pauses.find(p=>nextDue>=p.from&&(!p.until||nextDue<=p.until));if(!p)break;if(!p.until){nextDue='';break;}nextDue=nextSeasonDay(t,addDays(p.until,1))??'';}
  if(paused)return {occurrenceKey:due<=today?due:'',status:'paused',effectiveDueDate:due<=today?due:null,nextDueDate:nextDue||null,overdue:false};
  due=nextDue||due;
  if(due>today){const completed=c&&(!t.omission||c.created_at&&localDay(new Date(c.created_at))>t.omission.on);return {occurrenceKey:completed?c.occurrenceKey:'',status:completed?'done':'upcoming',effectiveDueDate:completed?c.occurrenceKey:null,nextDueDate:due,overdue:false};}
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
 if(!move||!isSeasonDay(t,today)||!isSeasonDay(t,move.until))return base;
 const boundary=t.cadence==='once'?null:seasonBoundary(t,today);
 if(boundary&&move.until<boundary)return base;
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
function cadenceLabel(t:PlannedTask){const days=['Mo','Di','Mi','Do','Fr','Sa','So'];switch(t.cadence){case 'after':return `${t.schedule?.intervalDays??14} Tage nach Erledigung`;case 'once':return 'Einmalig';case 'daily':return 'Täglich';case 'weekly':return 'Jede Woche';case 'weekdays':return (t.schedule?.weekdays??[]).map(d=>days[d-1]).join(', ');case 'interval':return `Alle ${t.schedule?.intervalWeeks??2} Wochen`;case 'monthly':return `Monatlich am ${t.schedule?.monthDay??1}.`;
 case 'monthly-interval':return `Alle ${t.schedule?.intervalMonths??3} Monate am ${Number(t.schedule?.startDate?.slice(8)??1)}.`;
 case 'monthly-weekday':{const ordinal:Record<number,string>={1:'ersten',2:'zweiten',3:'dritten',4:'vierten',[-1]:'letzten'};const weekdayNames=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];return `Jeden ${ordinal[t.schedule?.monthWeek??1]} ${weekdayNames[(t.schedule?.monthWeekday??1)-1]} im Monat`;}
 case 'yearly':return t.schedule?.startDate&&validDay(t.schedule.startDate)?`Jährlich am ${dayDate(t.schedule.startDate).toLocaleDateString('de-DE',{day:'numeric',month:'long',timeZone:'UTC'})}`:'Jährlich';
 default:return '';}}
export function seasonLabel(months?:number[]){return months&&months.length<12?[...months].sort((a,b)=>a-b).map(m=>MONTH_NAMES[m-1]).join(', '):'';}
export function scheduleLabel(t:PlannedTask){const season=seasonLabel(t.schedule?.activeMonths);return cadenceLabel(t)+(season?' · '+season:'');}
