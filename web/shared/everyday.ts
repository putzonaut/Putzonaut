import {addDays,localDay,weekKey} from './planning.ts';
export type Reminder={enabled:boolean;time:string;seenDay?:string};
export type WeeklyRecap={week:string;through:string;count:number;goal:number;reached:boolean};
export type Handover={id:string;occurrenceKey:string;fromId:string;createdAt:string;taskVersion:number;swapTaskId?:string;swapOccurrenceKey?:string;swapVersion?:number;toId?:string};
export type HandoverView=Handover&{taskId:string;title:string;fromName:string;swapTitle?:string;canAccept:boolean;canCancel:boolean};
export const reminderDefaults:Reminder={enabled:false,time:'18:00'};
export function berlinTime(now:Date){return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);}
export function previousWeek(now:Date){return addDays(weekKey(now),-7);}
export function recapFor(weeks:Record<string,{count:number;goal:number}>|undefined,dismissed:string|undefined,now:Date):WeeklyRecap|null{
 const week=previousWeek(now),saved=weeks?.[week];
 return saved&&saved.count>0&&dismissed!==week?{week,through:addDays(week,6),count:saved.count,goal:saved.goal,reached:saved.count>=saved.goal}:null;
}
/** The reminder is an in-app prompt, never a background notification promise. */
export function reminderDue(setting:Reminder|undefined,hasOpenMission:boolean,now:Date){
 return !!setting?.enabled&&hasOpenMission&&setting.seenDay!==localDay(now)&&berlinTime(now)>=setting.time;
}
