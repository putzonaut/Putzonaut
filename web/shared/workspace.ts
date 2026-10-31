import {addDays,assignment,plan} from './planning.ts';
import type {PlannedTask} from './planning.ts';

export const AREA_ICONS=['home','kitchen','sofa','bath','bed','leaf','sun','paw','car','tools','desk','box'] as const;
export type AreaIcon=typeof AREA_ICONS[number];
export type Area={id:string;name:string;icon:AreaIcon;builtIn?:boolean};
export type ChecklistStep={id:string;title:string};
export const DEFAULT_AREAS:Area[]=[
 {id:'kitchen',name:'Küche',icon:'kitchen',builtIn:true},
 {id:'living',name:'Wohnen',icon:'sofa',builtIn:true},
 {id:'bath',name:'Bad',icon:'bath',builtIn:true},
 {id:'household',name:'Haushalt',icon:'home',builtIn:true},
];
export function ensureAreas(h:{areas?:Area[];tasks:{room:string;areaId?:string}[]}){
 h.areas??=DEFAULT_AREAS.map(a=>({...a}));
 for(const t of h.tasks)if(!t.areaId)t.areaId=h.areas.find(a=>a.name===t.room)?.id??'household';
 return h.areas;
}
export type PlannedRound={taskId:string;occurrenceKey:string;dueDate:string|null;assignedTo:string|null;status:'open'|'overdue'|'pending';availableNow:boolean};
export type WeekPlan={from:string;through:string;days:{date:string;rounds:PlannedRound[]}[]};
/** A forecast, not a completion history: each still-open round appears once,
 * on its first available day in the seven-day window. */
export function createWeekPlan(tasks:(PlannedTask&{id:string})[],today:string,fallback:string,activeIds:string[],resolve?:{plan:(t:PlannedTask,day:string)=>ReturnType<typeof plan>;owner:(t:PlannedTask,day:string)=>string|null}):WeekPlan{
 const days=Array.from({length:7},(_,i)=>({date:addDays(today,i),rounds:[] as PlannedRound[]}));
 for(const t of tasks){
  const seen=new Set<string>();
  for(const [i,day] of days.entries()){
   const p=resolve?resolve.plan(t,day.date):plan(t,day.date,fallback);
   if(!p.occurrenceKey||p.status==='paused'||p.status==='upcoming'||p.status==='done'||seen.has(p.occurrenceKey))continue;
   seen.add(p.occurrenceKey);
   day.rounds.push({taskId:t.id,occurrenceKey:p.occurrenceKey,dueDate:p.effectiveDueDate,assignedTo:resolve?resolve.owner(t,day.date):assignment(t,day.date,activeIds),status:p.status==='pending'?'pending':p.overdue?'overdue':'open',availableNow:i===0&&p.status!=='pending'});
  }
 }
 return {from:today,through:days[6].date,days};
}
const searchable=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de-DE').replace(/ß/g,'ss');
export function matchesMission(task:{title:string;room:string;steps?:{title:string}[]},query:string){const text=searchable([task.title,task.room,...(task.steps??[]).map(s=>s.title)].join(' '));return searchable(query).trim().split(/\s+/).every(word=>text.includes(word));}
