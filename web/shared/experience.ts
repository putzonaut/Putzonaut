import type {State,Task,Unlock,HistoryItem} from '../src/types.ts';

export type CompletionReceipt={id:string;createdAt:string;canUndo:boolean;title:string;xp:number;stars:number;pending?:boolean;replayed?:boolean;unlocks?:Unlock[];bonusChanges?:HistoryItem['bonusChanges'];durationFeedback?:{eventId:string;minutes:number}};
export type CompletionHighlights={level:number|null;achievements:string[];station:string[];quest:boolean;special:boolean};

/** A shortcut only for the same simple own/free missions that can be started.
 * Checklists, shared work and another person's assignment keep their detail flow. */
export function quickCompleteAllowed(task:Task,userId:string,paused=false){
 return !paused&&['today','overdue'].includes(task.status)&&!!task.occurrenceKey
  &&!task.team&&!task.steps?.length&&!task.checklist?.steps.length
  &&(!task.effectiveAssignedTo||task.effectiveAssignedTo===userId);
}

/** Merge due rounds without mutating stored dates, schedules or responsibility. */
export function dueMissions(tasks:Task[]){
 return tasks.filter(t=>t.status==='today'||t.status==='overdue').sort((a,b)=>
  Number(b.status==='overdue')-Number(a.status==='overdue')
  ||(a.effectiveDueDate??'').localeCompare(b.effectiveDueDate??'')
  ||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id));
}

export function completionHighlights(before:State,after:State|null|undefined,receipt:CompletionReceipt):CompletionHighlights{
 const none:CompletionHighlights={level:null,achievements:[],station:[],quest:false,special:false};
 if(receipt.pending||receipt.replayed||!after||before.user.id!==after.user.id||before.viewer.id!==after.viewer.id||before.household.id!==after.household.id||before.restoreEpoch!==after.restoreEpoch)return none;
 const level=after.user.level>before.user.level?after.user.level:null;
 const achievements=receipt.unlocks?.filter(u=>u.userId===before.user.id).flatMap(u=>u.achievementIds)??[];
 const station=after.game.station.modules.filter(m=>m.unlocked&&before.game.station.modules.some(old=>old.id===m.id&&!old.unlocked)).map(m=>m.title);
 const quest=!!receipt.bonusChanges?.some(b=>b.userId===before.user.id&&b.stars>0);
 return {level,achievements,station,quest,special:!!level||achievements.length>0||station.length>0||quest};
}

export function roundMinutes(value:unknown):5|10|20{return value===5||value===20?value:10;}
