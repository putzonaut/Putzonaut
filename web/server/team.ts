import {z} from 'zod';
import {AppError,canManageChild,canUndo,reopenTask} from './domain.ts';
import type {Household,Member,Task,HistoryEvent} from './domain.ts';
import type {Repository} from './repository.ts';
import {localDay,weekKey} from '../shared/planning.ts';
import {awayOn,effort} from '../shared/life.ts';
import {taskPlan,taskOwner,clearTeam} from './life.ts';
import {evidenceCategory} from '../shared/categories.ts';
import {clearHandovers} from './everyday.ts';

export type TeamChange={result:unknown;event?:HistoryEvent;events?:HistoryEvent[]};
function finish(h:Household,t:Task,actor:Member,now:Date):TeamChange{
 const team=t.team!;
 if(!team.shares.every(s=>s.confirmed&&s.approved))return {result:{ok:true,waiting:true}};
 const ids=team.shares.map(()=>crypto.randomUUID());
 const events=team.shares.map((s,i):HistoryEvent=>({id:ids[i],teamId:team.id,teamEventIds:ids,kind:'completion',userId:s.userId,name:s.name,title:t.title,createdAt:now.toISOString(),xp:s.xp,stars:s.stars,minutes:t.minutes,effort:effort(t)/2,taskId:t.id,occurrenceKey:team.occurrenceKey,approvalRequired:s.needsApproval,category:t.category??evidenceCategory(t),room:t.room,icon:t.icon,steps:(t.steps??[]).map(s=>({...s})),recordedBy:actor.id,recordedByName:actor.name}));
 for(const s of team.shares){const m=h.members.find(m=>m.id===s.userId&&!m.removedAt);if(!m)throw new AppError(409,'Die Crew hat sich verändert. Bitte startet die gemeinsame Mission neu.');m.xp+=s.xp;m.stars+=s.stars;m.completedCount++;m.weekCount++;}
 delete t.reopenedDue;t.completion={id:ids[0],status:'approved',occurrenceKey:team.occurrenceKey,userId:team.shares[0].userId,user_name:team.shares.map(s=>s.name).join(' & '),created_at:now.toISOString(),xp:t.xp,stars:t.stars,steps:t.steps};
 clearTeam(h,t);clearHandovers(h,t.id);
 const own=events.find(e=>e.userId===actor.id);return {result:{ok:true,completed:true,id:own?.id??ids[0],xp:own?.xp??0,stars:own?.stars??0,unlocks:[]},events};
}
export async function teamChange(route:string,method:string,body:unknown,h:Household,user:Member,viewer:Member,now:Date,repo:Repository):Promise<TeamChange|null>{
 const id=route.split('/')[2],day=localDay(now);
 const event=(kind:string,title:string,extra:Partial<HistoryEvent>={}):HistoryEvent=>({id:crypto.randomUUID(),kind,userId:user.id,name:user.name,title,createdAt:now.toISOString(),...extra});
 if(/^\/tasks\/[^/]+\/team$/.test(route)){
  const t=h.tasks.find(t=>t.id===id);if(!t)throw new AppError(404,'Diese Mission gibt es nicht mehr.');
  const p=taskPlan(h,t,day),owner=taskOwner(h,t,day);
  if(method==='DELETE'){
   const v=z.object({teamId:z.string().uuid()}).parse(body);
   if(!t.team||t.team.id!==v.teamId)throw new AppError(409,'Die gemeinsame Runde hat sich verändert.');
   if(user.role!=='admin'&&!t.team.shares.some(s=>s.userId===user.id))throw new AppError(403,'Diese Runde gehört einem anderen Team.');
   clearTeam(h,t);return {result:{ok:true},event:event('team','Gemeinsame Runde aufgelöst: '+t.title)};
  }
  if(awayOn(user.away,day)||awayOn(h.away,day))throw new AppError(409,'Beende zuerst deine Auszeit.');
  if(!['today','overdue'].includes(p.status))throw new AppError(409,'Diese Aufgabenrunde ist nicht offen.');
  if(method==='POST'){
   const v=z.object({partnerId:z.string().uuid(),occurrenceKey:z.string(),taskVersion:z.number().int().min(0)}).strict().parse(body);
   if(t.team||v.occurrenceKey!==p.occurrenceKey||v.taskVersion!==(t.revision??0))throw new AppError(409,'Die Runde wurde inzwischen verändert. Bitte öffne sie erneut.');
   if(owner&&owner!==user.id)throw new AppError(403,'Nur die eingeteilte Person kann diese Mission gemeinsam starten.');
   const partner=h.members.find(m=>m.id===v.partnerId&&m.id!==user.id&&!m.removedAt);
   if(!partner||awayOn(partner.away,day))throw new AppError(400,'Wähle ein verfügbares Crewmitglied.');
   t.team={id:crypto.randomUUID(),occurrenceKey:p.occurrenceKey,createdBy:user.id,shares:[user,partner].map((m,i)=>({userId:m.id,name:m.name,xp:Math.floor(t.xp/2)+(i===0?t.xp%2:0),stars:Math.floor(t.stars/2)+(i===0?t.stars%2:0),confirmed:false,approved:!(m.kind==='child'&&t.approvalForChildren),needsApproval:m.kind==='child'&&!!t.approvalForChildren}))};
   t.revision=(t.revision??0)+1;clearHandovers(h,t.id);return {result:{ok:true}};
  }
  if(method==='PATCH'){
   const v=z.object({teamId:z.string().uuid(),occurrenceKey:z.string(),taskVersion:z.number().int().min(0)}).strict().parse(body);
   const team=t.team;if(!team||v.teamId!==team.id||v.occurrenceKey!==team.occurrenceKey||v.taskVersion!==(t.revision??0))throw new AppError(409,'Diese gemeinsame Runde hat sich verändert.');
   const share=team.shares.find(s=>s.userId===user.id);if(!share)throw new AppError(403,'Du bist an dieser Mission nicht beteiligt.');
   if(share.confirmed)return {result:{ok:true,waiting:true}};
   const checked=t.checklist?.occurrenceKey===p.occurrenceKey?t.checklist.doneIds:[];
   if(t.steps?.some(s=>!checked.includes(s.id)))throw new AppError(409,'Hakt zuerst alle Teilschritte ab.');
   share.confirmed=true;
   if(share.needsApproval){
    if((h.pendingCompletions?.length??0)>=200)throw new AppError(409,'Bitte lasst zuerst offene Meldungen bestätigen.');
    const e=event('submitted',t.title,{teamId:team.id,taskId:t.id,occurrenceKey:p.occurrenceKey,xp:share.xp,stars:share.stars,steps:t.steps,approvalRequired:true,recordedBy:viewer.id,recordedByName:viewer.name});
    (h.pendingCompletions??=[]).push({...e,teamId:team.id,taskId:t.id,occurrenceKey:p.occurrenceKey,xp:share.xp,stars:share.stars});
    return {result:{ok:true,waiting:true},event:e};
   }
   return finish(h,t,viewer,now);
  }
  throw new AppError(405,'Diese Aktion ist hier nicht möglich.');
 }
 if(/^\/completions\/[^/]+\/(approve|reject|withdraw)$/.test(route)&&method==='POST'){
  const claim=h.pendingCompletions?.find(p=>p.id===id);if(!claim?.teamId)return null;
  const action=route.split('/')[3],review=canManageChild(h,user,claim.userId);
  if(action==='withdraw'?!(review||claim.userId===user.id):!review)throw new AppError(403,'Wechsle zum Profil der Begleitperson oder des Captains.');
  const t=h.tasks.find(t=>t.id===claim.taskId),share=t?.team?.id===claim.teamId?t.team.shares.find(s=>s.userId===claim.userId):null;
  if(!t||!share||taskPlan(h,t,day).occurrenceKey!==claim.occurrenceKey)throw new AppError(409,'Diese gemeinsame Runde ist nicht mehr aktuell.');
  h.pendingCompletions=h.pendingCompletions!.filter(p=>p.id!==id);
  if(action==='approve'){share.approved=true;return finish(h,t,user,now);}
  share.confirmed=false;share.approved=false;return {result:{ok:true},event:event('rejected',claim.title,{userId:claim.userId,name:claim.name,teamId:claim.teamId,taskId:t.id,occurrenceKey:claim.occurrenceKey})};
 }
 if(/^\/completions\/[^/]+\/undo$/.test(route)&&method==='POST'){
  const original=await repo.eventById(h.id,id);if(!original?.teamEventIds)return null;
  if(!canUndo(h,user,original))throw new AppError(403,'Diesen Abschluss kannst du nicht zurücknehmen.');
  if(await repo.existingRequest(original.userId,'undo:'+id))return {result:{ok:true,alreadyUndone:true}};
  const originals=await Promise.all(original.teamEventIds.map(id=>repo.eventById(h.id,id)));
  if(originals.some(e=>!e||e.teamId!==original.teamId))throw new AppError(409,'Die gemeinsame Buchung ist unvollständig.');
  const events:HistoryEvent[]=[];
  for(const e of originals as HistoryEvent[]){
   if(await repo.existingRequest(e.userId,'undo:'+e.id))throw new AppError(409,'Die gemeinsame Buchung wurde bereits korrigiert.');
   const m=h.members.find(m=>m.id===e.userId)!;m.xp=Math.max(0,m.xp-(e.xp??0));m.stars-=e.stars??0;m.completedCount=Math.max(0,m.completedCount-1);if(weekKey(new Date(e.createdAt))===weekKey(now))m.weekCount=Math.max(0,m.weekCount-1);
   events.push(event('correction',e.title,{teamId:e.teamId,userId:m.id,name:m.name,xp:-(e.xp??0),stars:-(e.stars??0),effort:e.effort,requestKey:'undo:'+e.id,reverses:e.id,originalCreatedAt:e.createdAt,taskId:e.taskId,progressTracked:e.progressTracked,category:e.category,room:e.room,icon:e.icon,recordedBy:viewer.id,recordedByName:viewer.name}));
  }
  const t=h.tasks.find(t=>t.id===original.taskId);if(t?.completion?.id&&original.teamEventIds.includes(t.completion.id)){clearTeam(h,t);reopenTask(t,now,h.createdAt);}
  return {result:{ok:true},events};
 }
 return null;
}
