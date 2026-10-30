import {z} from 'zod';
import {admin,AppError} from './domain.ts';
import type {Household,Member,HistoryEvent,Task} from './domain.ts';
import {assignment,localDay,plan} from '../shared/planning.ts';
import {elapsedRound} from '../shared/rounds.ts';
import type {RoundView} from '../shared/rounds.ts';

function available(h:Household,m:Member,t:Task,now:Date){const day=localDay(now),p=plan(t,day,localDay(new Date(h.createdAt))),assigned=assignment(t,day,h.members.filter(m=>!m.removedAt).map(m=>m.id));return ['today','overdue'].includes(p.status)&&(!assigned||assigned===m.id)?p.occurrenceKey:null;}
export function roundView(h:Household,m:Member,now:Date):RoundView|null{
 if(!m.round)return null;return {...m.round,entries:m.round.entries.map(e=>{const t=h.tasks.find(t=>t.id===e.taskId);return {...e,available:!!t&&available(h,m,t,now)===e.occurrenceKey};})};
}
/** Observe the normal completion transaction; never award points for a timer. */
export function updateRounds(h:Household,e:HistoryEvent|undefined){
 if(!e)return;
 for(const m of h.members){const r=m.round;if(!r)continue;let changed=false;
  for(const entry of r.entries){
   if(e.kind==='correction'&&entry.eventId===e.reverses){Object.assign(entry,{outcome:'open',xp:0,stars:0,eventId:undefined});changed=true;continue;}
   if(e.taskId!==entry.taskId||e.occurrenceKey!==entry.occurrenceKey||entry.outcome==='skipped')continue;
   if(e.kind==='completion'){Object.assign(entry,{outcome:e.userId===m.id?'done':'crew',eventId:e.id,xp:e.userId===m.id?e.xp??0:0,stars:e.userId===m.id?e.stars??0:0});changed=true;}
   if(e.kind==='submitted'){Object.assign(entry,{outcome:'pending',eventId:e.id,xp:0,stars:0});changed=true;}
   if(e.kind==='rejected'&&entry.outcome==='pending'){Object.assign(entry,{outcome:'open',eventId:undefined,xp:0,stars:0});changed=true;}
  }
  if(changed)r.version++;
 }
}
export function roundChange(route:string,method:string,body:unknown,h:Household,m:Member,now:Date){
 if(route==='/profile/motion'&&method==='PATCH'){m.animations=z.object({enabled:z.boolean()}).parse(body).enabled;return {result:{ok:true}};}
 if(/^\/routines(?:\/[^/]+)?$/.test(route)){
  admin(m);const list=h.routines??=[],id=route.split('/')[2];const existing=list.find(r=>r.id===id);
  if(id&&!existing)throw new AppError(404,'Diese Routine gibt es nicht mehr.');
  if(id&&method==='DELETE'){h.routines=list.filter(r=>r.id!==id);return {result:{ok:true}};}
  if(id?method!=='PATCH':method!=='POST')throw new AppError(405,'Diese Aktion ist hier nicht möglich.');
  const v=z.object({title:z.string().trim().min(2).max(60),taskIds:z.array(z.string().uuid()).min(1).max(3)}).parse(body);
  if(new Set(v.taskIds).size!==v.taskIds.length||v.taskIds.some(id=>!h.tasks.some(t=>t.id===id)))throw new AppError(400,'Wähle bis zu drei verschiedene vorhandene Missionen.');
  if(id){Object.assign(existing!,v);return {result:{id}};}
  if(list.length>=12)throw new AppError(409,'Ihr könnt bis zu zwölf Routinen speichern.');
  const routine={id:crypto.randomUUID(),...v};h.routines=[...list,routine];return {result:{id:routine.id}};
 }
 if(route==='/rounds'&&method==='POST'){
  if(m.round&&!m.round.finishedAt)throw new AppError(409,'Deine Putzrunde läuft noch. Setze sie fort oder beende sie.');
  const v=z.object({taskIds:z.array(z.string().uuid()).min(1).max(3).optional(),minutes:z.union([z.literal(5),z.literal(10),z.literal(20)]).optional(),routineId:z.string().uuid().optional()}).parse(body);
  const routine=v.routineId?h.routines?.find(r=>r.id===v.routineId):null;if(v.routineId&&!routine)throw new AppError(404,'Diese Routine gibt es nicht mehr.');
  const taskIds=routine?routine.taskIds.filter(id=>{const t=h.tasks.find(t=>t.id===id);return t&&available(h,m,t,now);}):v.taskIds;
  if(!taskIds?.length||new Set(taskIds).size!==taskIds.length)throw new AppError(409,'Gerade ist keine passende Mission offen.');
  const tasks=taskIds.map(id=>h.tasks.find(t=>t.id===id));if(tasks.some(t=>!t||!available(h,m,t,now)))throw new AppError(409,'Die Auswahl hat sich geändert. Bitte starte die Runde neu.');
  const minutes=tasks.reduce((n,t)=>n+t!.minutes,0);if(!routine&&(!v.minutes||minutes>v.minutes))throw new AppError(400,'Die Missionen passen nicht in dein Zeitbudget.');
  m.round={id:crypto.randomUUID(),version:1,title:routine?.title??'Deine kleine Putzrunde',createdAt:now.toISOString(),minutes:routine?minutes:v.minutes!,entries:tasks.map(t=>({taskId:t!.id,occurrenceKey:available(h,m,t!,now)!,title:t!.title,minutes:t!.minutes,outcome:'open',xp:0,stars:0})),elapsedMs:0,runningSince:null,timerEnabled:false,finishedAt:null};return {result:{id:m.round.id}};
 }
 if(/^\/rounds\/[^/]+$/.test(route)&&method==='PATCH'){
  const v=z.object({version:z.number().int(),action:z.enum(['pause','resume','enable','disable','finish','skip']),taskId:z.string().uuid().optional()}).parse(body),r=m.round;
  if(!r||r.id!==route.split('/')[2])throw new AppError(404,'Diese Putzrunde gibt es nicht mehr.');
  if(r.version!==v.version||r.finishedAt)throw new AppError(409,'Die Putzrunde wurde inzwischen geändert. Bitte lade sie neu.');
  const stop=()=>{r.elapsedMs=elapsedRound(r,now.getTime());r.runningSince=null;};
  if(v.action==='finish'){stop();r.finishedAt=now.toISOString();}
  if(v.action==='pause')stop();
  if(v.action==='enable'||v.action==='resume'){r.timerEnabled=true;r.runningSince??=now.toISOString();}
  if(v.action==='disable'){stop();r.timerEnabled=false;}
  if(v.action==='skip'){const entry=r.entries.find(e=>e.taskId===v.taskId);if(!entry||entry.outcome!=='open')throw new AppError(409,'Diese Mission ist nicht mehr offen.');entry.outcome='skipped';}
  r.version++;return {result:{ok:true}};
 }
 return null;
}
