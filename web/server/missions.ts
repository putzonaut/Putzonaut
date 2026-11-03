import {taskPlan,taskOwner,clearTeam} from './life.ts';
import {effort,awayOn} from '../shared/life.ts';
import {clearHandovers} from './everyday.ts';
import {evidenceCategory} from '../shared/categories.ts';
import {z} from 'zod';
import {suggestedPoints} from '../shared/game.ts';
import {activeMembers,admin,AppError,canManageChild,canUndo,reopenTask,taskSchema} from './domain.ts';
import type {Household,Member,HistoryEvent,PendingCompletion,Task} from './domain.ts';
import {addDays,assignment,localDay,monday,plan,validDay,weekKey,calendarScheduleError} from '../shared/planning.ts';
import type {Repository} from './repository.ts';

export async function missionChange(route:string,method:string,body:unknown,h:Household,user:Member,viewer:Member,now:Date,repo:Repository):Promise<{result:unknown;event?:HistoryEvent}|null>{
 if(!/^\/(tasks|completions)(\/|$)/.test(route))return null;
 const today=localDay(now),id=route.split('/')[2],members=activeMembers(h),ids=members.map(m=>m.id);
 const event=(kind:string,title:string,extra:Partial<HistoryEvent>={}):HistoryEvent=>({id:crypto.randomUUID(),kind,title,userId:user.id,name:user.name,createdAt:now.toISOString(),...(user.id!==viewer.id?{recordedBy:viewer.id,recordedByName:viewer.name}:{}),...extra});
 const task=()=>{const t=h.tasks.find(t=>t.id===id);if(!t)throw new AppError(404,'Diese Mission wurde nicht gefunden.');return t;};
 const planning=(t:Task)=>taskPlan(h,t,today);
 const values=(existing?:Task)=>{
  const v=taskSchema.parse(body);const s=v.schedule;
  const area=v.areaId?h.areas!.find(a=>a.id===v.areaId):h.areas!.find(a=>a.name===v.room);
  if(!area)throw new AppError(400,'Wähle einen Bereich aus eurer Crew.');
  const suppliedIds=(v.steps??[]).flatMap(s=>s.id?[s.id]:[]);
  if(new Set(suppliedIds).size!==suppliedIds.length||suppliedIds.some(id=>!existing?.steps?.some(s=>s.id===id)))throw new AppError(400,'Die Teilschritte wurden verändert. Bitte öffne die Mission erneut.');
  const steps=v.steps===undefined?existing?.steps??[]:v.steps.map(s=>({id:s.id??crypto.randomUUID(),title:s.title}));
  if(v.assignedTo&&!ids.includes(v.assignedTo)||(v.rotationIds??[]).some(id=>!ids.includes(id)))throw new AppError(400,'Wähle aktive Crewmitglieder.');
  if(v.rotationIds?.length&&v.assignedTo)throw new AppError(400,'Wähle eine feste Zuständigkeit oder einen Wechsel.');
  if(v.rotationIds&&new Set(v.rotationIds).size!==v.rotationIds.length)throw new AppError(400,'Jedes Mitglied darf nur einmal in der Reihenfolge stehen.');
  if((v.dueDate&&!validDay(v.dueDate))||(s?.startDate&&!validDay(s.startDate)))throw new AppError(400,'Bitte wähle ein gültiges Datum zwischen 2000 und 2099.');
  if(v.cadence==='weekdays'&&!s?.weekdays?.length)throw new AppError(400,'Wähle mindestens einen Wochentag.');
  if(v.cadence==='interval'&&(!s?.startDate||!s.intervalWeeks))throw new AppError(400,'Wähle Startdatum und Wochenabstand.');
  if(v.cadence==='after'&&!s?.intervalDays)throw new AppError(400,'Wähle den Abstand nach Erledigung.');
  if(v.cadence==='monthly'&&!s?.monthDay)throw new AppError(400,'Wähle einen Monatstag.');
  const calendarError=calendarScheduleError(v);if(calendarError)throw new AppError(400,calendarError);
  return {...v,category:v.category??evidenceCategory(v)??'tidy',areaId:area.id,room:area.name,steps,schedule:v.schedule,rotationIds:v.rotationIds??[],approvalForChildren:v.approvalForChildren??false};
 };
 if(route==='/tasks/record'&&method==='POST'){
  const v=z.object({requestKey:z.string().uuid(),title:z.string().trim().min(2).max(80),minutes:z.number().int().min(1).max(180),difficulty:z.enum(['easy','normal','hard']),areaId:z.string().min(1).max(40)}).strict().parse(body);
  const operation=JSON.stringify(['record',v.title,v.minutes,v.difficulty,v.areaId]);
  const old=await repo.existingRequest(user.id,v.requestKey);
  if(old){if(old.operation!==operation)throw new AppError(409,'Diese Erfassung wurde bereits mit anderen Angaben gespeichert. Prüfe bitte euer Logbuch.');return {result:{id:old.id,taskId:old.taskId,title:old.title,replayed:true,pending:old.kind==='submitted',canUndo:false,xp:0,stars:0}};}
  if(awayOn(user.away,today)||awayOn(h.away,today))throw new AppError(409,'Beende zuerst deine Auszeit.');
  const area=h.areas?.find(a=>a.id===v.areaId);if(!area)throw new AppError(400,'Wähle einen Bereich aus eurer Crew.');
  if(h.tasks.some(t=>t.title.trim().toLocaleLowerCase('de')===v.title.toLocaleLowerCase('de')&&['today','overdue'].includes(planning(t).status)&&(!taskOwner(h,t,today)||taskOwner(h,t,today)===user.id)))throw new AppError(409,'Diese Mission ist schon geplant. Öffne bitte die vorhandene Mission.');
  if(h.tasks.length>=200)throw new AppError(409,'Bitte lasst zuerst eine alte Mission archivieren.');
  // Adults can record only their own or an already authorized child's effort.
  // Child submissions always use the existing approval path.
  if(user.kind==='child'&&!canManageChild(h,viewer,user.id))throw new AppError(403,'Dieses Kinderprofil kannst du nicht begleiten.');
  const t:Task={...taskSchema.parse({title:v.title,minutes:v.minutes,difficulty:v.difficulty,...suggestedPoints(v.minutes,v.difficulty),areaId:area.id,room:area.name,icon:'sparkles',cadence:'once',assignedTo:user.id,dueDate:today,approvalForChildren:user.kind==='child'}),id:crypto.randomUUID(),createdOn:today,completion:null,steps:[]};
  t.category=evidenceCategory(t)??'tidy';h.tasks.push(t);
  const change=(await missionChange(`/tasks/${t.id}/complete`,'POST',{occurrenceKey:'once',checklistVersion:0},h,user,viewer,now,repo))!;
  change.event!.requestKey=v.requestKey;change.event!.operation=operation;
  return {...change,result:{...(change.result as object),taskId:t.id}};
 }
 if(route==='/tasks'&&method==='POST'){
  admin(user);if(h.tasks.length>=200)throw new AppError(409,'Bitte archiviere zuerst eine alte Mission.');
  const t={...values(),id:crypto.randomUUID(),createdOn:today,rotationStart:monday(today),completion:null};h.tasks.push(t);return {result:{id:t.id}};
 }
 if(/^\/tasks\/[^/]+$/.test(route)&&method==='PATCH'){
  admin(user);const t=task(),old=planning(t),v=values(t);if(t.team)throw new AppError(409,'Beende zuerst die gemeinsame Mission oder löse die gemeinsame Runde auf.');
  const scheduleChanged=JSON.stringify([t.cadence,t.schedule,t.dueDate])!==JSON.stringify([v.cadence,v.schedule,v.dueDate]);
  if(scheduleChanged){delete t.reopenedDue;delete t.postponement;}
  if(scheduleChanged||JSON.stringify(t.steps??[])!==JSON.stringify(v.steps))t.checklistVersion=(t.checklistVersion??0)+1;
  if(t.checklist){if(scheduleChanged)t.checklist=null;else t.checklist.doneIds=t.checklist.doneIds.filter(id=>v.steps.some(s=>s.id===id&&s.title===t.steps?.find(old=>old.id===id)?.title));}
  if(JSON.stringify(v.rotationIds??[])!==JSON.stringify(t.rotationIds??[]))t.rotationStart=monday(today);
  if(scheduleChanged||v.assignedTo!==t.assignedTo||JSON.stringify(v.rotationIds)!==JSON.stringify(t.rotationIds))delete t.roundAssignment;
  t.revision=(t.revision??0)+1;delete t.balancedAssignment;clearHandovers(h,t.id);Object.assign(t,v);if(t.completion&&t.completion.occurrenceKey===old.occurrenceKey){const next=planning(t);if(next.occurrenceKey)t.completion.occurrenceKey=next.occurrenceKey;}
  return {result:{ok:true}};
 }
 if(/^\/tasks\/[^/]+$/.test(route)&&method==='DELETE'){admin(user);clearTeam(h,task());clearHandovers(h,id);h.tasks=h.tasks.filter(t=>t.id!==id);return {result:{ok:true}};}
 if(/^\/tasks\/[^/]+\/postpone$/.test(route)&&method==='POST'){
  const v=z.object({occurrenceKey:z.string().max(20),taskVersion:z.number().int().min(0),until:z.string().refine(validDay)}).strict().parse(body);
  const t=task(),p=planning(t),owner=taskOwner(h,t,today);
  if(owner&&owner!==user.id&&user.role!=='admin')throw new AppError(403,'Diese Mission ist einem anderen Crewmitglied zugeteilt.');
  if(awayOn(user.away,today)||awayOn(h.away,today))throw new AppError(409,'Beende zuerst deine Auszeit.');
  if(t.team)throw new AppError(409,'Beende zuerst die gemeinsame Mission oder löse die gemeinsame Runde auf.');
  if(v.taskVersion!==(t.revision??0)||v.occurrenceKey!==p.occurrenceKey)throw new AppError(409,'Die Aufgabenrunde hat sich geändert. Bitte öffne sie erneut.');
  if(!p.occurrenceKey||!['today','overdue'].includes(p.status)||t.completion?.occurrenceKey===p.occurrenceKey)throw new AppError(409,'Nur eine offene Aufgabenrunde lässt sich verschieben.');
  if(v.until<=today||v.until>addDays(today,365))throw new AppError(400,'Wähle einen Termin ab morgen innerhalb eines Jahres.');
  if(awayOn(t.pause,v.until)||awayOn(h.away,v.until)||owner&&awayOn(members.find(m=>m.id===owner)?.away,v.until))throw new AppError(409,'Der gewählte Termin liegt in einer Pause. Wähle einen anderen Tag.');
  t.postponement={occurrenceKey:p.occurrenceKey,from:p.effectiveDueDate??today,until:v.until};
  if(owner)t.roundAssignment={occurrenceKey:p.occurrenceKey,memberId:owner};
  t.revision=(t.revision??0)+1;clearHandovers(h,t.id);
  return {result:{ok:true},event:event('postponed',`${t.title}: verschoben auf ${v.until}`,{taskId:t.id,occurrenceKey:p.occurrenceKey})};
 }
 if(/^\/tasks\/[^/]+\/pause$/.test(route)&&method==='POST'){
  admin(user);const t=task();const v=z.object({from:z.string(),until:z.string().nullable()}).parse(body);
  if(!validDay(v.from)||v.from<today||(v.until&&(!validDay(v.until)||v.until<v.from)))throw new AppError(400,'Wähle einen Zeitraum ab heute. Das Ende darf nicht vor dem Beginn liegen.');
  // Remember an expired/active pause before replacing it, so skipped rounds stay skipped.
  if(t.pause&&t.pause.from<=today){const end=t.pause.until&&t.pause.until<today?t.pause.until:addDays(today,-1);t.skipThrough=[t.skipThrough||'',end].sort().at(-1);}
  clearTeam(h,t);t.pause=v;t.revision=(t.revision??0)+1;clearHandovers(h,t.id);return {result:{ok:true},event:event('pause',`${t.title}: Pause ab ${v.from}${v.until?' bis '+v.until:''}`)};
 }
 if(/^\/tasks\/[^/]+\/resume$/.test(route)&&method==='POST'){
  admin(user);const t=task();if(t.pause&&t.pause.from<=today){const end=t.pause.until&&t.pause.until<today?t.pause.until:addDays(today,-1);t.skipThrough=[t.skipThrough||'',end].sort().at(-1);}t.pause=null;t.revision=(t.revision??0)+1;clearHandovers(h,t.id);
  return {result:{ok:true},event:event('pause',`${t.title}: Pause beendet`)};
 }
 if(/^\/tasks\/[^/]+\/checklist$/.test(route)&&method==='PATCH'){
  const v=z.object({occurrenceKey:z.string().max(20),checklistVersion:z.number().int().min(0),stepId:z.string().uuid(),done:z.boolean()}).parse(body);const t=task(),p=planning(t),assigned=taskOwner(h,t,today);
  if(assigned&&assigned!==user.id&&user.role!=='admin'&&!t.team?.shares.some(s=>s.userId===user.id))throw new AppError(403,'Diese Mission ist einem anderen Crewmitglied zugeteilt.');
  if(awayOn(user.away,today)||awayOn(h.away,today))throw new AppError(409,'Beende zuerst deine Auszeit.');
  if(!p.occurrenceKey||p.status==='paused'||p.status==='upcoming'||v.occurrenceKey!==p.occurrenceKey)throw new AppError(409,'Diese Aufgabenrunde ist gerade nicht offen. Bitte lade die Mission neu.');
  if(t.completion?.occurrenceKey===p.occurrenceKey)throw new AppError(409,'Diese Runde wurde bereits gemeldet oder erledigt.');
  if(v.checklistVersion!==(t.checklistVersion??0))throw new AppError(409,'Die Checkliste wurde verändert. Bitte lade die Mission neu.');
  if(!t.steps?.some(s=>s.id===v.stepId))throw new AppError(409,'Dieser Teilschritt wurde verändert. Bitte lade die Mission neu.');
  if(t.checklist?.occurrenceKey!==p.occurrenceKey)t.checklist={occurrenceKey:p.occurrenceKey,doneIds:[]};
  const done=new Set(t.checklist!.doneIds);if(v.done)done.add(v.stepId);else done.delete(v.stepId);t.checklist!.doneIds=[...done];
  return {result:{ok:true}};
 }
 if(/^\/tasks\/[^/]+\/complete$/.test(route)&&method==='POST'){
  const v=z.object({occurrenceKey:z.string().max(20),checklistVersion:z.number().int().min(0).optional(),requestKey:z.string().uuid().optional(),taskVersion:z.number().int().min(0).optional(),checkedStepIds:z.array(z.string().uuid()).max(12).optional()}).parse(body);
  if(v.requestKey&&(v.taskVersion===undefined||v.checklistVersion===undefined))throw new AppError(400,'Die Vormerkung ist unvollständig. Bitte öffne die Mission neu.');
  const operation=JSON.stringify(['completion',id,v.occurrenceKey,v.taskVersion,v.checklistVersion,[...(v.checkedStepIds??[])].sort()]);
  if(v.requestKey){const old=await repo.existingRequest(user.id,v.requestKey);if(old){if(old.operation!==operation)throw new AppError(409,'Diese Vormerkung gehört zu einem anderen Abschluss.');return {result:{id:old.id,createdAt:old.createdAt,title:old.title,pending:old.kind==='submitted',xp:old.kind==='submitted'?0:old.xp,stars:old.kind==='submitted'?0:old.stars,canUndo:false,replayed:true}};}}
  const t=task(),p=planning(t);const assigned=taskOwner(h,t,today);
  if(v.taskVersion!==undefined&&v.taskVersion!==(t.revision??0))throw new AppError(409,'Die Mission wurde inzwischen verändert. Bitte prüfe die Vormerkung.');
  if(assigned&&assigned!==user.id&&user.role!=='admin'&&!t.team?.shares.some(s=>s.userId===user.id))throw new AppError(403,'Diese Mission ist einem anderen Crewmitglied zugeteilt.');
  if(awayOn(user.away,today)||awayOn(h.away,today))throw new AppError(409,'Beende zuerst deine Auszeit.');
  if(t.team)throw new AppError(409,'Bestätige deinen Teil über die gemeinsame Mission.');
  if(p.status==='paused'||p.status==='upcoming')throw new AppError(409,p.status==='paused'?'Diese Mission pausiert gerade.':'Diese Mission ist noch nicht dran.');
  if(v.occurrenceKey!==p.occurrenceKey)throw new AppError(409,'Eine neue Aufgabenrunde hat begonnen. Bitte lade die Missionen neu.');
  if(t.completion?.occurrenceKey===p.occurrenceKey)throw new AppError(409,'Diese Runde wurde bereits gemeldet oder erledigt.');
  if(((t.steps?.length??0)>0||v.checklistVersion!==undefined)&&v.checklistVersion!==(t.checklistVersion??0))throw new AppError(409,'Die Checkliste wurde verändert. Bitte lade die Mission neu.');
  if(v.checkedStepIds){if(new Set(v.checkedStepIds).size!==v.checkedStepIds.length||v.checkedStepIds.some(id=>!t.steps?.some(s=>s.id===id)))throw new AppError(409,'Die vorgemerkten Teilschritte passen nicht mehr.');
   const existing=t.checklist?.occurrenceKey===p.occurrenceKey?t.checklist.doneIds:[];t.checklist={occurrenceKey:p.occurrenceKey,doneIds:[...new Set([...existing,...v.checkedStepIds])]};}
  const checked=t.checklist?.occurrenceKey===p.occurrenceKey?t.checklist.doneIds:[];
  if((t.steps??[]).some(s=>!checked.includes(s.id)))throw new AppError(409,'Erledige zuerst alle Teilschritte dieser Runde.');
  const pending=user.kind==='child'&&!!t.approvalForChildren;
  if(pending&&(h.pendingCompletions?.length??0)>=200)throw new AppError(409,'Bitte lasst zuerst offene Missionen bestätigen.');
  const e=event(pending?'submitted':'completion',t.title,{...(v.requestKey?{requestKey:v.requestKey,operation}:{}),xp:t.xp,stars:t.stars,taskId:t.id,occurrenceKey:p.occurrenceKey,approvalRequired:pending,minutes:t.minutes,effort:effort(t),category:t.category??evidenceCategory(t),room:t.room,icon:t.icon,steps:(t.steps??[]).map(s=>({...s}))});
  clearHandovers(h,t.id);delete t.reopenedDue;t.completion={steps:e.steps,id:e.id,status:pending?'pending':'approved',occurrenceKey:p.occurrenceKey,userId:user.id,user_name:user.name,created_at:now.toISOString(),xp:t.xp,stars:t.stars};
  if(pending){(h.pendingCompletions??=[]).push(e as PendingCompletion);}else{user.xp+=t.xp;user.stars+=t.stars;user.weekCount++;user.completedCount++;}
  return {result:{...(!pending&&user.completedCount%3===0?{durationFeedback:{eventId:e.id,minutes:t.minutes}}:{}),id:e.id,createdAt:e.createdAt,canUndo:!pending,title:t.title,xp:pending?0:t.xp,stars:pending?0:t.stars,pending},event:e};
 }
 if(/^\/completions\/[^/]+\/(approve|reject|withdraw)$/.test(route)&&method==='POST'){
  const claim=h.pendingCompletions?.find(c=>c.id===id);if(!claim)throw new AppError(409,'Diese Meldung wurde bereits bearbeitet.');
  const action=route.split('/')[3],review=canManageChild(h,user,claim.userId);
  if(action==='withdraw'?!(review||claim.userId===user.id):!review)throw new AppError(403,'Wechsle zum Profil der Begleitperson oder des Captains.');
  const child=members.find(m=>m.id===claim.userId);if(!child)throw new AppError(409,'Dieses Kinderprofil ist nicht mehr in der Crew.');
  h.pendingCompletions=h.pendingCompletions!.filter(c=>c.id!==id);const t=h.tasks.find(t=>t.id===claim.taskId);
  if(action==='approve'){
   child.xp+=claim.xp;child.stars+=claim.stars;child.weekCount++;child.completedCount++;
   const e=event('completion',claim.title,{minutes:claim.minutes,effort:claim.effort??(t?effort(t):undefined),userId:child.id,name:child.name,xp:claim.xp,stars:claim.stars,taskId:claim.taskId,occurrenceKey:claim.occurrenceKey,approvalRequired:true,category:claim.category??evidenceCategory(claim),room:claim.room??t?.room,icon:claim.icon??t?.icon,steps:claim.steps??[],recordedBy:user.id,recordedByName:user.name});
   if(t?.completion?.id===id)t.completion={...t.completion,id:e.id,status:'approved',created_at:now.toISOString()};
   return {result:{ok:true},event:e};
  }
  if(t?.completion?.id===id)reopenTask(t,now,h.createdAt);
  return {result:{ok:true},event:event('rejected',`${claim.title}: ${action==='withdraw'?'Meldung zurückgezogen':'noch einmal prüfen'}`,{taskId:claim.taskId,occurrenceKey:claim.occurrenceKey,userId:child.id,name:child.name,recordedBy:viewer.id,recordedByName:viewer.name})};
 }
 if(/^\/completions\/[^/]+\/undo$/.test(route)&&method==='POST'){
  const original=await repo.eventById(h.id,id);if(!original)throw new AppError(404,'Dieser Abschluss wurde nicht gefunden.');
  if(!canUndo(h,user,original))throw new AppError(403,'Diesen Abschluss kannst du nicht zurücknehmen.');
  if(await repo.existingRequest(original.userId,'undo:'+id))return {result:{ok:true,alreadyUndone:true}};
  const beneficiary=h.members.find(m=>m.id===original.userId);if(!beneficiary)throw new AppError(409,'Dieses Profil wurde nicht gefunden.');
  beneficiary.xp=Math.max(0,beneficiary.xp-(original.xp??0));beneficiary.stars-=original.stars??0;beneficiary.completedCount=Math.max(0,beneficiary.completedCount-1);
  if(weekKey(new Date(original.createdAt))===weekKey(now))beneficiary.weekCount=Math.max(0,beneficiary.weekCount-1);
  const t=h.tasks.find(t=>t.id===original.taskId);if(t?.completion?.id===id)reopenTask(t,now,h.createdAt);
  return {result:{ok:true},event:event('correction',original.title,{userId:beneficiary.id,name:beneficiary.name,xp:-(original.xp??0),stars:-(original.stars??0),requestKey:'undo:'+id,reverses:id,originalCreatedAt:original.createdAt,taskId:original.taskId,effort:original.effort,progressTracked:original.progressTracked,category:original.category,room:original.room,icon:original.icon,recordedBy:viewer.id,recordedByName:viewer.name})};
 }
 throw new AppError(404,'Diese Missionsaktion gibt es nicht.');
}
