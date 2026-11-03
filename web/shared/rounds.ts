import {roomOrder} from './room-order.ts';
import {availableMissions} from './quick-start.ts';
import type {Task,User} from '../src/types.ts';
import type {Area} from './workspace.ts';

export type Routine={id:string;title:string;taskIds:string[]};
export type RoundEntry={taskId:string;occurrenceKey:string;title:string;minutes:number;outcome:'open'|'done'|'pending'|'crew'|'skipped';eventId?:string;xp:number;stars:number};
export type CleaningRound={id:string;version:number;title:string;createdAt:string;minutes:number;entries:RoundEntry[];elapsedMs:number;runningSince:string|null;timerEnabled:boolean;finishedAt:string|null};
export type RoundView=Omit<CleaningRound,'entries'>&{entries:(RoundEntry&{available:boolean})[]};
export function roundMissions(tasks:Task[],user:Pick<User,'id'>,minutes:number){
 const selected:Task[]=[];let remaining=minutes;
 for(const t of availableMissions(tasks,user)){if(t.minutes<=remaining){selected.push(t);remaining-=t.minutes;}if(selected.length===3)break;}
 return roomOrder(selected);
}
export function elapsedRound(r:Pick<CleaningRound,'elapsedMs'|'runningSince'>,now:number){return r.elapsedMs+(r.runningSince?Math.max(0,now-Date.parse(r.runningSince)):0);}
export function roomSummaries(areas:Area[],tasks:Task[],user:Pick<User,'id'>){return areas.map(area=>{
 const all=tasks.filter(t=>t.areaId===area.id),open=all.filter(t=>['today','overdue'].includes(t.status)),pending=all.filter(t=>t.status==='pending').length,paused=all.filter(t=>t.status==='paused').length;
 return {area,total:all.length,open:open.length,pending,paused,next:availableMissions(open,user)[0],label:!all.length?'Noch keine Missionen':open.length?`${open.length} ${open.length===1?'Aufgabe steht an':'Aufgaben stehen an'}`:pending?'Wartet auf Bestätigung':paused===all.length?'Missionen pausieren':'Alles aktuell'};
});}
export function routineIdeas(tasks:Task[]):Omit<Routine,'id'>[]{
 const select=(category:string)=>tasks.filter(t=>t.category===category).sort((a,b)=>a.minutes-b.minutes);
 const kitchen=select('kitchen'),tidy=select('tidy'),bath=select('bath'),laundry=select('laundry');
 const ids=(items:Task[])=>[...new Set(items.map(t=>t.id))].slice(0,3);
 return [
  {title:'Besuch kommt',taskIds:ids([...tidy.slice(0,1),...bath.slice(0,1),...kitchen.slice(0,1)])},
  {title:'Feierabend schaffen',taskIds:ids([...tidy.slice(0,1),...kitchen.slice(0,1),...laundry.slice(0,1)])},
  {title:'Küche nach dem Kochen',taskIds:ids([...kitchen.filter(t=>/geschirr|spül|arbeits|herd|tisch/i.test(t.title)),...kitchen])},
  {title:'Sonntags frisch starten',taskIds:ids([...bath,...laundry])},
 ].filter(r=>r.taskIds.length);
}
