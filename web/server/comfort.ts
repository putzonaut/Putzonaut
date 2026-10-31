import {z} from 'zod';
import {AppError,admin,canManageChild} from './domain.ts';
import type {Household,Member,HistoryEvent} from './domain.ts';
import type {Repository} from './repository.ts';
import {durationSuggestion,trophyView} from '../shared/comfort.ts';
import {clearHandovers} from './everyday.ts';

export async function comfortChange(route:string,method:string,body:unknown,h:Household,user:Member,viewer:Member,now:Date,repo:Repository){
 if(route==='/station/trophies'&&method==='PATCH'){
  admin(user);const {items}=z.object({items:z.array(z.object({memberId:z.string().uuid(),achievementId:z.string().max(40)}).strict()).max(3)}).strict().parse(body);
  const choices=trophyView(h).choices;
  if(new Set(items.map(t=>t.memberId+':'+t.achievementId)).size!==items.length||items.some(t=>!choices.some(c=>c.memberId===t.memberId&&c.achievementId===t.achievementId)))throw new AppError(400,'Wähle bis zu drei bereits verdiente Abzeichen aktiver Crewmitglieder.');
  h.trophies=items;return {result:{ok:true}};
 }
 const match=route.match(/^\/completions\/([^/]+)\/(thanks|duration)$/);
 if(match&&method==='POST'){
  const e=await repo.eventById(h.id,match[1]);
  if(!e||e.kind!=='completion'||await repo.existingRequest(e.userId,'undo:'+e.id))throw new AppError(409,'Dieser bestätigte Abschluss ist nicht mehr verfügbar.');
  const thanks=match[2]==='thanks';
  const author=thanks?viewer:h.members.find(m=>m.id===e.userId)!,key=(thanks?'thanks:':'duration:')+e.id;
  if(thanks&&e.userId===viewer.id)throw new AppError(400,'Ein Dankeschön ist für ein anderes Crewmitglied.');
  if(!thanks&&e.userId!==user.id&&!canManageChild(h,viewer,e.userId))throw new AppError(403,'Nur die beteiligte Person oder ihre Begleitperson kann die Dauer einschätzen.');
  if(await repo.existingRequest(author.id,key))return {result:{ok:true,replayed:true}};
  if(thanks)return {result:{ok:true},event:{id:crypto.randomUUID(),kind:'thanks',requestKey:key,completionId:e.id,userId:author.id,name:author.name,title:`Danke an ${e.name}: ${e.title}`,createdAt:now.toISOString()} as HistoryEvent};
  const {rating}=z.object({rating:z.union([z.literal(-1),z.literal(0),z.literal(1)])}).strict().parse(body),t=h.tasks.find(t=>t.id===e.taskId);
  if(!t||!e.minutes||e.minutes!==t.minutes||now.getTime()-new Date(e.createdAt).getTime()>30*86400000)throw new AppError(409,'Diese Zeiteinschätzung passt nicht mehr zur aktuellen Mission.');
  t.durationSamples=[...(t.durationSamples??[]),{eventId:e.id,roundId:e.teamId??e.id,userId:e.userId,minutes:e.minutes,rating,at:now.toISOString()}].slice(-12);
  return {result:{ok:true},event:{id:crypto.randomUUID(),kind:'duration',requestKey:key,completionId:e.id,userId:author.id,name:author.name,title:e.title,taskId:t.id,rating,createdAt:now.toISOString()} as HistoryEvent};
 }
 const proposal=route.match(/^\/tasks\/([^/]+)\/duration$/);
 if(proposal&&method==='PATCH'){
  admin(user);const {action,key}=z.object({action:z.enum(['accept','dismiss']),key:z.string().max(500)}).strict().parse(body),t=h.tasks.find(t=>t.id===proposal[1]);
  if(!t)throw new AppError(404,'Diese Mission gibt es nicht mehr.');const suggestion=durationSuggestion(t);
  if(!suggestion||suggestion.key!==key)throw new AppError(409,'Der Vorschlag hat sich geändert. Bitte öffne die Mission neu.');
  if(action==='dismiss'){t.durationDismissed=key;return {result:{ok:true}};}
  if(t.team)throw new AppError(409,'Beendet zuerst die laufende gemeinsame Mission.');
  t.minutes=suggestion.minutes;t.durationSamples=[];delete t.durationDismissed;t.revision=(t.revision??0)+1;clearHandovers(h,t.id);
  return {result:{ok:true}};
 }
 return null;
}
export function correctDuration(h:Household,e:HistoryEvent){if(e.kind==='correction'&&e.reverses)for(const t of h.tasks)if(t.durationSamples)t.durationSamples=t.durationSamples.filter(s=>s.eventId!==e.reverses);}
