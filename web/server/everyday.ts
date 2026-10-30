import {z} from 'zod';
import {AppError,activeMembers} from './domain.ts';
import type {Household,Member,Task,HistoryEvent} from './domain.ts';
import {assignment,plan,localDay} from '../shared/planning.ts';
import {previousWeek,reminderDefaults,reminderDue,recapFor} from '../shared/everyday.ts';
import type {HandoverView} from '../shared/everyday.ts';

function current(h:Household,t:Task,now:Date){const day=localDay(now);return {...plan(t,day,localDay(new Date(h.createdAt))),owner:assignment(t,day,activeMembers(h).map(m=>m.id))};}
export function validHandover(h:Household,t:Task,now:Date){
 const r=t.handover;if(!r)return false;const p=current(h,t,now),ids=activeMembers(h).map(m=>m.id);
 if(!ids.includes(r.fromId)||r.toId&&!ids.includes(r.toId)||!['today','overdue'].includes(p.status)||p.occurrenceKey!==r.occurrenceKey||p.owner!==r.fromId||(t.revision??0)!==r.taskVersion)return false;
 if(r.swapTaskId){const other=h.tasks.find(x=>x.id===r.swapTaskId);if(!other)return false;const q=current(h,other,now);if(!['today','overdue'].includes(q.status)||q.owner!==r.toId||q.occurrenceKey!==r.swapOccurrenceKey||(other.revision??0)!==r.swapVersion)return false;}
 return true;
}
export function handoverViews(h:Household,m:Member,now:Date):HandoverView[]{return h.tasks.filter(t=>validHandover(h,t,now)).flatMap(t=>{
 const r=t.handover!;if(r.fromId!==m.id&&r.toId&&r.toId!==m.id)return [];
 return [{...r,taskId:t.id,title:t.title,fromName:h.members.find(x=>x.id===r.fromId)!.name,swapTitle:h.tasks.find(x=>x.id===r.swapTaskId)?.title,canAccept:r.fromId!==m.id&&(!r.toId||r.toId===m.id),canCancel:r.fromId===m.id}];
});}
export function clearHandovers(h:Household,taskId:string){for(const t of h.tasks)if(t.id===taskId||t.handover?.swapTaskId===taskId)delete t.handover;}
export function everydayView(h:Household,m:Member,now:Date){
 const hasOpenMission=h.tasks.some(t=>{const p=current(h,t,now);return ['today','overdue'].includes(p.status)&&(!p.owner||p.owner===m.id);});
 return {recap:recapFor(m.career?.weeks,m.recapDismissedWeek,now),reminder:{...(m.reminder??reminderDefaults),due:reminderDue(m.reminder,hasOpenMission,now)},handovers:handoverViews(h,m,now)};
}
export function everydayChange(route:string,method:string,body:unknown,h:Household,m:Member,now:Date):{result:unknown;event?:HistoryEvent}|null{
 if(route==='/profile/recap'&&method==='PATCH'){const {week}=z.object({week:z.string()}).parse(body);if(week!==previousWeek(now))throw new AppError(409,'Eine neue Woche hat begonnen. Bitte lade den Rückblick neu.');m.recapDismissedWeek=week;return {result:{ok:true}};}
 if(route==='/profile/reminder'&&method==='PATCH'){const v=z.object({enabled:z.boolean(),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}).strict().parse(body);m.reminder={...v,...(m.reminder?.seenDay?{seenDay:m.reminder.seenDay}:{})};return {result:{ok:true}};}
 if(route==='/profile/reminder/seen'&&method==='POST'){
  const {day}=z.object({day:z.string()}).parse(body);if(day!==localDay(now))throw new AppError(409,'Ein neuer Tag hat begonnen.');
  const due=everydayView(h,m,now).reminder.due;if(!due)return {result:{show:false}};
  m.reminder={...(m.reminder??reminderDefaults),seenDay:day};return {result:{show:true,day}};
 }
 if(!/^\/tasks\/[^/]+\/handover(?:\/[^/]+)?$/.test(route))return null;
 const t=h.tasks.find(t=>t.id===route.split('/')[2]);if(!t)throw new AppError(404,'Diese Mission gibt es nicht mehr.');const p=current(h,t,now);
 if(route.split('/').length===4&&method==='POST'){
  const v=z.object({occurrenceKey:z.string(),taskVersion:z.number().int().min(0),swapTaskId:z.string().uuid().optional()}).strict().parse(body);
  if(!['today','overdue'].includes(p.status)||p.occurrenceKey!==v.occurrenceKey||(t.revision??0)!==v.taskVersion)throw new AppError(409,'Die Aufgabenrunde hat sich geändert. Bitte öffne sie erneut.');
  if(p.owner!==m.id)throw new AppError(403,'Du kannst nur für deine eigene zugeteilte Mission um Hilfe bitten.');
  if(activeMembers(h).length<2)throw new AppError(409,'Dafür braucht es ein weiteres Crewmitglied.');
  if(validHandover(h,t,now))throw new AppError(409,'Für diese Mission läuft bereits eine Anfrage.');
  const r={id:crypto.randomUUID(),occurrenceKey:p.occurrenceKey,fromId:m.id,createdAt:now.toISOString(),taskVersion:t.revision??0};
  if(v.swapTaskId){const other=h.tasks.find(x=>x.id===v.swapTaskId);if(!other||other.id===t.id)throw new AppError(400,'Wähle eine andere offene Mission.');const q=current(h,other,now);if(!q.owner||q.owner===m.id||!['today','overdue'].includes(q.status))throw new AppError(409,'Die Tauschmission ist nicht mehr bei einem anderen Crewmitglied offen.');t.handover={...r,swapTaskId:other.id,swapOccurrenceKey:q.occurrenceKey,swapVersion:other.revision??0,toId:q.owner};}
  else t.handover=r;
  return {result:{id:r.id}};
 }
 const requestId=route.split('/')[4];if(!t.handover||t.handover.id!==requestId)throw new AppError(409,'Diese Anfrage wurde inzwischen beendet.');const r=t.handover;
 if(method==='DELETE'){if(r.fromId!==m.id&&m.role!=='admin')throw new AppError(403,'Diese Anfrage kannst du nicht zurücknehmen.');delete t.handover;return {result:{ok:true}};}
 if(method!=='PATCH')throw new AppError(405,'Diese Aktion ist nicht möglich.');
 const {action}=z.object({action:z.enum(['accept','decline'])}).strict().parse(body);
 if(r.fromId===m.id||r.toId&&r.toId!==m.id)throw new AppError(403,'Diese Anfrage ist für ein anderes Crewmitglied.');
 if(!validHandover(h,t,now))throw new AppError(409,'Eine Aufgabe oder Zuständigkeit hat sich geändert. Bitte stellt die Anfrage neu.');
 if(action==='decline'){if(!r.toId)throw new AppError(400,'Eine offene Anfrage kannst du einfach überspringen.');delete t.handover;return {result:{ok:true}};}
 const other=h.tasks.find(x=>x.id===r.swapTaskId);
 t.roundAssignment={occurrenceKey:r.occurrenceKey,memberId:m.id};t.revision=(t.revision??0)+1;
 if(other){other.roundAssignment={occurrenceKey:r.swapOccurrenceKey!,memberId:r.fromId};other.revision=(other.revision??0)+1;clearHandovers(h,other.id);}
 clearHandovers(h,t.id);
 return {result:{ok:true},event:{id:crypto.randomUUID(),kind:'handover',userId:m.id,name:m.name,title:other?`${m.name} und ${h.members.find(x=>x.id===r.fromId)!.name} tauschen: ${t.title} ↔ ${other.title}`:`${m.name} übernimmt: ${t.title}`,taskId:t.id,occurrenceKey:r.occurrenceKey,createdAt:now.toISOString()}};
}
