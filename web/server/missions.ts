import {z} from 'zod';
import {activeMembers,admin,AppError,canManageChild,canUndo,taskSchema} from './domain.ts';
import type {Household,Member,HistoryEvent,PendingCompletion,Task} from './domain.ts';
import {addDays,assignment,localDay,monday,plan,validDay,weekKey} from '../shared/planning.ts';
import type {Repository} from './repository.ts';

export async function missionChange(route:string,method:string,body:unknown,h:Household,user:Member,viewer:Member,now:Date,repo:Repository):Promise<{result:unknown;event?:HistoryEvent}|null>{
 if(!/^\/(tasks|completions)(\/|$)/.test(route))return null;
 const today=localDay(now),id=route.split('/')[2],members=activeMembers(h),ids=members.map(m=>m.id);
 const event=(kind:string,title:string,extra:Partial<HistoryEvent>={}):HistoryEvent=>({id:crypto.randomUUID(),kind,title,userId:user.id,name:user.name,createdAt:now.toISOString(),...(user.id!==viewer.id?{recordedBy:viewer.id,recordedByName:viewer.name}:{}),...extra});
 const task=()=>{const t=h.tasks.find(t=>t.id===id);if(!t)throw new AppError(404,'Diese Mission wurde nicht gefunden.');return t;};
 const planning=(t:Task)=>plan(t,today,localDay(new Date(h.createdAt)));
 const values=()=>{
  const v=taskSchema.parse(body);const s=v.schedule;
  if(v.assignedTo&&!ids.includes(v.assignedTo)||(v.rotationIds??[]).some(id=>!ids.includes(id)))throw new AppError(400,'Wähle aktive Crewmitglieder.');
  if(v.rotationIds?.length&&v.assignedTo)throw new AppError(400,'Wähle eine feste Zuständigkeit oder einen Wechsel.');
  if(v.rotationIds&&new Set(v.rotationIds).size!==v.rotationIds.length)throw new AppError(400,'Jedes Mitglied darf nur einmal in der Reihenfolge stehen.');
  if((v.dueDate&&!validDay(v.dueDate))||(s?.startDate&&!validDay(s.startDate)))throw new AppError(400,'Bitte wähle ein gültiges Datum zwischen 2000 und 2099.');
  if(v.cadence==='weekdays'&&!s?.weekdays?.length)throw new AppError(400,'Wähle mindestens einen Wochentag.');
  if(v.cadence==='interval'&&(!s?.startDate||!s.intervalWeeks))throw new AppError(400,'Wähle Startdatum und Wochenabstand.');
  if(v.cadence==='monthly'&&!s?.monthDay)throw new AppError(400,'Wähle einen Monatstag.');
  return {...v,schedule:v.schedule,rotationIds:v.rotationIds??[],approvalForChildren:v.approvalForChildren??false};
 };
 if(route==='/tasks'&&method==='POST'){
  admin(user);if(h.tasks.length>=200)throw new AppError(409,'Bitte archiviere zuerst eine alte Mission.');
  const t={...values(),id:crypto.randomUUID(),createdOn:today,rotationStart:monday(today),completion:null};h.tasks.push(t);return {result:{id:t.id}};
 }
 if(/^\/tasks\/[^/]+$/.test(route)&&method==='PATCH'){
  admin(user);const t=task(),old=planning(t),v=values();
  if(JSON.stringify(v.rotationIds??[])!==JSON.stringify(t.rotationIds??[]))t.rotationStart=monday(today);
  Object.assign(t,v);if(t.completion&&t.completion.occurrenceKey===old.occurrenceKey){const next=planning(t);if(next.occurrenceKey)t.completion.occurrenceKey=next.occurrenceKey;}
  return {result:{ok:true}};
 }
 if(/^\/tasks\/[^/]+$/.test(route)&&method==='DELETE'){admin(user);task();h.tasks=h.tasks.filter(t=>t.id!==id);return {result:{ok:true}};}
 if(/^\/tasks\/[^/]+\/pause$/.test(route)&&method==='POST'){
  admin(user);const t=task();const v=z.object({from:z.string(),until:z.string().nullable()}).parse(body);
  if(!validDay(v.from)||v.from<today||(v.until&&(!validDay(v.until)||v.until<v.from)))throw new AppError(400,'Wähle einen Zeitraum ab heute. Das Ende darf nicht vor dem Beginn liegen.');
  // Remember an expired/active pause before replacing it, so skipped rounds stay skipped.
  if(t.pause&&t.pause.from<=today){const end=t.pause.until&&t.pause.until<today?t.pause.until:addDays(today,-1);t.skipThrough=[t.skipThrough||'',end].sort().at(-1);}
  t.pause=v;return {result:{ok:true},event:event('pause',`${t.title}: Pause ab ${v.from}${v.until?' bis '+v.until:''}`)};
 }
 if(/^\/tasks\/[^/]+\/resume$/.test(route)&&method==='POST'){
  admin(user);const t=task();if(t.pause&&t.pause.from<=today){const end=t.pause.until&&t.pause.until<today?t.pause.until:addDays(today,-1);t.skipThrough=[t.skipThrough||'',end].sort().at(-1);}t.pause=null;
  return {result:{ok:true},event:event('pause',`${t.title}: Pause beendet`)};
 }
 if(/^\/tasks\/[^/]+\/complete$/.test(route)&&method==='POST'){
  const v=z.object({occurrenceKey:z.string().max(20)}).parse(body);const t=task(),p=planning(t);const assigned=assignment(t,today,ids);
  if(assigned&&assigned!==user.id&&user.role!=='admin')throw new AppError(403,'Diese Mission ist einem anderen Crewmitglied zugeteilt.');
  if(p.status==='paused'||p.status==='upcoming')throw new AppError(409,p.status==='paused'?'Diese Mission pausiert gerade.':'Diese Mission ist noch nicht dran.');
  if(v.occurrenceKey!==p.occurrenceKey)throw new AppError(409,'Eine neue Aufgabenrunde hat begonnen. Bitte lade die Missionen neu.');
  if(t.completion?.occurrenceKey===p.occurrenceKey)throw new AppError(409,'Diese Runde wurde bereits gemeldet oder erledigt.');
  const pending=user.kind==='child'&&!!t.approvalForChildren;
  if(pending&&(h.pendingCompletions?.length??0)>=200)throw new AppError(409,'Bitte lasst zuerst offene Missionen bestätigen.');
  const e=event(pending?'submitted':'completion',t.title,{xp:t.xp,stars:t.stars,taskId:t.id,occurrenceKey:p.occurrenceKey,approvalRequired:pending,room:t.room,icon:t.icon});
  t.completion={id:e.id,status:pending?'pending':'approved',occurrenceKey:p.occurrenceKey,userId:user.id,user_name:user.name,created_at:now.toISOString(),xp:t.xp,stars:t.stars};
  if(pending){(h.pendingCompletions??=[]).push(e as PendingCompletion);}else{user.xp+=t.xp;user.stars+=t.stars;user.weekCount++;user.completedCount++;}
  return {result:{title:t.title,xp:pending?0:t.xp,stars:pending?0:t.stars,pending},event:e};
 }
 if(/^\/completions\/[^/]+\/(approve|reject|withdraw)$/.test(route)&&method==='POST'){
  const claim=h.pendingCompletions?.find(c=>c.id===id);if(!claim)throw new AppError(409,'Diese Meldung wurde bereits bearbeitet.');
  const action=route.split('/')[3],review=canManageChild(h,user,claim.userId);
  if(action==='withdraw'?!(review||claim.userId===user.id):!review)throw new AppError(403,'Wechsle zum Profil der Begleitperson oder des Captains.');
  const child=members.find(m=>m.id===claim.userId);if(!child)throw new AppError(409,'Dieses Kinderprofil ist nicht mehr in der Crew.');
  h.pendingCompletions=h.pendingCompletions!.filter(c=>c.id!==id);const t=h.tasks.find(t=>t.id===claim.taskId);
  if(action==='approve'){
   child.xp+=claim.xp;child.stars+=claim.stars;child.weekCount++;child.completedCount++;
   const e=event('completion',claim.title,{userId:child.id,name:child.name,xp:claim.xp,stars:claim.stars,taskId:claim.taskId,occurrenceKey:claim.occurrenceKey,approvalRequired:true,room:claim.room??t?.room,icon:claim.icon??t?.icon,recordedBy:user.id,recordedByName:user.name});
   if(t?.completion?.id===id)t.completion={...t.completion,id:e.id,status:'approved',created_at:now.toISOString()};
   return {result:{ok:true},event:e};
  }
  if(t?.completion?.id===id)t.completion=null;
  return {result:{ok:true},event:event('rejected',`${claim.title}: ${action==='withdraw'?'Meldung zurückgezogen':'noch einmal prüfen'}`,{userId:child.id,name:child.name,recordedBy:viewer.id,recordedByName:viewer.name})};
 }
 if(/^\/completions\/[^/]+\/undo$/.test(route)&&method==='POST'){
  const original=await repo.eventById(h.id,id);if(!original)throw new AppError(404,'Dieser Abschluss wurde nicht gefunden.');
  if(!canUndo(h,user,original))throw new AppError(403,'Diesen Abschluss kannst du nicht zurücknehmen.');
  if(await repo.existingRequest(original.userId,'undo:'+id))return {result:{ok:true,alreadyUndone:true}};
  const beneficiary=h.members.find(m=>m.id===original.userId);if(!beneficiary)throw new AppError(409,'Dieses Profil wurde nicht gefunden.');
  beneficiary.xp=Math.max(0,beneficiary.xp-(original.xp??0));beneficiary.stars-=original.stars??0;beneficiary.completedCount=Math.max(0,beneficiary.completedCount-1);
  if(weekKey(new Date(original.createdAt))===weekKey(now))beneficiary.weekCount=Math.max(0,beneficiary.weekCount-1);
  const t=h.tasks.find(t=>t.id===original.taskId);if(t?.completion?.id===id)t.completion=null;
  return {result:{ok:true},event:event('correction',original.title,{userId:beneficiary.id,name:beneficiary.name,xp:-(original.xp??0),stars:-(original.stars??0),requestKey:'undo:'+id,reverses:id,originalCreatedAt:original.createdAt,progressTracked:original.progressTracked,room:original.room,icon:original.icon,recordedBy:viewer.id,recordedByName:viewer.name})};
 }
 throw new AppError(404,'Diese Missionsaktion gibt es nicht.');
}
