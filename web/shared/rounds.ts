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
 return selected;
}
export function elapsedRound(r:Pick<CleaningRound,'elapsedMs'|'runningSince'>,now:number){return r.elapsedMs+(r.runningSince?Math.max(0,now-Date.parse(r.runningSince)):0);}
export function roomSummaries(areas:Area[],tasks:Task[],user:Pick<User,'id'>){return areas.map(area=>{
 const all=tasks.filter(t=>t.areaId===area.id),open=all.filter(t=>['today','overdue'].includes(t.status)),pending=all.filter(t=>t.status==='pending').length,paused=all.filter(t=>t.status==='paused').length;
 return {area,total:all.length,open:open.length,pending,paused,next:availableMissions(open,user)[0],label:!all.length?'Noch keine Missionen':open.length?`${open.length} ${open.length===1?'Aufgabe steht an':'Aufgaben stehen an'}`:pending?'Wartet auf Bestätigung':paused===all.length?'Missionen pausieren':'Alles aktuell'};
});}
export function routineIdeas(tasks:Task[]):Omit<Routine,'id'>[]{
 const kitchen=tasks.filter(t=>t.category==='kitchen'||t.room==='Küche'),tidy=tasks.filter(t=>t.category==='tidy'),fresh=tasks.filter(t=>t.category==='bath'||t.category==='laundry');
 return [{title:'Küche nach dem Essen',taskIds:kitchen.slice(0,3).map(t=>t.id)},{title:'Abends kurz klar Schiff',taskIds:[...new Set([...tidy.slice(0,2),...kitchen.slice(0,1)].map(t=>t.id))]},{title:'Sonntags frisch starten',taskIds:fresh.slice(0,3).map(t=>t.id)}].filter(r=>r.taskIds.length);
}
