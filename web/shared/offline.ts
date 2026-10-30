import type {State,Task} from '../src/types.ts';
export type CompletionIntent={requestKey:string;viewerId:string;householdId:string;profileId:string;profileName:string;restoreEpoch:string;taskId:string;title:string;occurrenceKey:string;taskVersion:number;checklistVersion:number;checkedStepIds:string[];createdAt:string;status:'pending'|'conflict';error?:string};
export type DeviceData={version:1;snapshot:State;queue:CompletionIntent[];drafts:Record<string,string[]>};
export const sameDeviceScope=(a:State,b:State)=>a.viewer.id===b.viewer.id&&a.household.id===b.household.id;
export function cacheSnapshot(previous:DeviceData|undefined,state:State):DeviceData{
 const same=previous&&sameDeviceScope(previous.snapshot,state);
 const restored=same&&previous.snapshot.restoreEpoch!==state.restoreEpoch;
 return {version:1,snapshot:{...state,receivedAt:undefined},queue:same?previous.queue.map(q=>restored?{...q,status:'conflict',error:'Die Crew wurde wiederhergestellt. Prüfe diese Vormerkung neu.'}:q):[],drafts:same&&!restored?previous.drafts:{}};
}
export function draftKey(state:State,t:Task){return [state.user.id,t.id,t.occurrenceKey,t.revision??0,t.checklist?.version??0].join(':');}
export function intentFor(state:State,t:Task,checkedStepIds:string[],requestKey:string,now=new Date()):CompletionIntent{
 return {requestKey,viewerId:state.viewer.id,householdId:state.household.id,profileId:state.user.id,profileName:state.user.name,restoreEpoch:state.restoreEpoch,taskId:t.id,title:t.title,occurrenceKey:t.occurrenceKey,taskVersion:t.revision??0,checklistVersion:t.checklist?.version??0,checkedStepIds:[...checkedStepIds],createdAt:now.toISOString(),status:'pending'};
}
export function appendIntent(data:DeviceData,intent:CompletionIntent){
 if(data.snapshot.viewer.id!==intent.viewerId||data.snapshot.household.id!==intent.householdId||data.snapshot.restoreEpoch!==intent.restoreEpoch)throw new Error('Der gespeicherte Crewstand hat sich geändert. Bitte lade die App neu.');
 const existing=data.queue.find(q=>q.profileId===intent.profileId&&q.taskId===intent.taskId&&q.occurrenceKey===intent.occurrenceKey);
 if(existing)return existing;
 if(data.queue.length>=50)throw new Error('Es sind bereits 50 Abschlüsse vorgemerkt. Verbinde dich zuerst mit dem Internet.');
 data.queue.push(intent);return intent;
}
export function replayProblem(q:CompletionIntent,state:State){
 if(q.viewerId!==state.viewer.id||q.householdId!==state.household.id)return 'Dein Konto oder deine Crew hat sich geändert.';
 if(q.restoreEpoch!==state.restoreEpoch)return 'Die Crew wurde wiederhergestellt. Prüfe diese Vormerkung neu.';
 return null;
}
export function completionBody(q:CompletionIntent){return {requestKey:q.requestKey,occurrenceKey:q.occurrenceKey,taskVersion:q.taskVersion,checklistVersion:q.checklistVersion,checkedStepIds:q.checkedStepIds};}
