import {z} from 'zod';
import {AppError,admin} from './domain.ts';
import type {Household,Member,Task,HistoryEvent} from './domain.ts';
import {addDays,assignment,localDay,plan,validDay,weekKey} from '../shared/planning.ts';
import type {Pause} from '../shared/planning.ts';
import {updateRounds} from './rounds.ts';
import {awayOn,effort,decorationView} from '../shared/life.ts';

export function taskOwner(h:Household,t:Task,day:string){
 const ids=h.members.filter(m=>!m.removedAt&&(!(t.rotationIds?.length)||!awayOn(m.away,day))).map(m=>m.id);
 const key=plan(t,day,t.createdOn??day).occurrenceKey;if(t.rotationMode==='balanced'&&t.roundAssignment?.occurrenceKey!==key)return t.balancedAssignment?.occurrenceKey===key&&ids.includes(t.balancedAssignment.memberId)?t.balancedAssignment.memberId:null;
 const all=h.members.filter(m=>!m.removedAt).map(m=>m.id),assigned=assignment(t,day,all);
 if(!t.rotationIds?.length||!assigned||ids.includes(assigned))return assigned;
 const order=t.rotationIds.filter(id=>all.includes(id)),index=order.indexOf(assigned);
 for(let i=1;i<=order.length;i++){const next=order[(Math.max(0,index)+i)%order.length];if(ids.includes(next))return next;}return null;
}
export function taskPlan(h:Household,t:Task,day:string){
 const owner=taskOwner(h,t,day),person=h.members.find(m=>m.id===owner);
 const breaks:Pause[]=[h.away,...(!t.rotationIds?.length?[person?.away]:[])].filter((p):p is Pause=>!!p);
 if(t.rotationIds?.length&&!owner){const pauses=t.rotationIds.map(id=>h.members.find(m=>m.id===id)?.away).filter((p):p is Pause=>!!p&&awayOn(p,day));if(pauses.length&&t.rotationIds.every(id=>!h.members.some(m=>m.id===id&&!m.removedAt&&!awayOn(m.away,day)))){const ends=pauses.flatMap(p=>p.until?[p.until]:[]).sort();breaks.push({from:day,until:ends[0]??null});}}
 let skipThrough=t.skipThrough;
 // If every selected person was away on a recurring due date, do not revive
 // that missed occurrence after the first person returns.
 const base=plan(t,day,localDay(new Date(h.createdAt)));
 if(t.cadence!=='once'&&t.rotationIds?.length&&base.occurrenceKey){
  const pool=t.rotationIds.map(id=>h.members.find(m=>m.id===id&&!m.removedAt)).filter((m):m is Member=>!!m);
  if(pool.length&&pool.every(m=>awayOn(m.away,base.occurrenceKey))){const ends=pool.flatMap(m=>m.away?.until?[m.away.until]:[]).sort();if(ends[0]&&ends[0]<day)skipThrough=[skipThrough??'',ends[0]].sort().at(-1);}
 }
 return plan({...t,skipThrough,breaks},day,localDay(new Date(h.createdAt)));
}
export function clearTeam(h:Household,t:Task){if(!t.team)return;for(const p of h.pendingCompletions??[])if(p.teamId===t.team.id)updateRounds(h,{...p,kind:'rejected'});h.pendingCompletions=h.pendingCompletions?.filter(p=>p.teamId!==t.team!.id);delete t.team;t.revision=(t.revision??0)+1;}
export function normalizeLife(h:Household,now:Date){
 const day=localDay(now),week=weekKey(now);
 for(const t of h.tasks){if(t.rotationIds?.length&&t.roundAssignment&&awayOn(h.members.find(m=>m.id===t.roundAssignment!.memberId)?.away,day)){delete t.roundAssignment;delete t.handover;t.revision=(t.revision??0)+1;}if(t.team&&(t.team.occurrenceKey!==taskPlan(h,t,day).occurrenceKey||t.team.shares.some(s=>!h.members.some(m=>m.id===s.userId&&!m.removedAt)||awayOn(h.members.find(m=>m.id===s.userId)?.away,day))||awayOn(h.away,day)))clearTeam(h,t);}
 const loads=new Map(h.members.map(m=>[m.id,m.effortWeeks?.[week]??0]));
 for(const t of h.tasks){const p=taskPlan(h,t,day);if(!['today','overdue'].includes(p.status))continue;const id=taskOwner(h,t,day);if(id&&(t.rotationMode!=='balanced'||t.balancedAssignment?.occurrenceKey===p.occurrenceKey||t.roundAssignment?.occurrenceKey===p.occurrenceKey))loads.set(id,(loads.get(id)??0)+effort(t));}
 for(const t of [...h.tasks].sort((a,b)=>effort(b)-effort(a)||a.id.localeCompare(b.id))){
  if(t.rotationMode!=='balanced'||!t.rotationIds?.length)continue;
  const p=taskPlan(h,t,day);if(!['today','overdue'].includes(p.status)||t.roundAssignment?.occurrenceKey===p.occurrenceKey)continue;
  const eligible=h.members.filter(m=>!m.removedAt&&t.rotationIds!.includes(m.id)&&!awayOn(m.away,day));
  if(t.balancedAssignment?.occurrenceKey===p.occurrenceKey&&eligible.some(m=>m.id===t.balancedAssignment!.memberId))continue;
  const last=t.balancedAssignment?.memberId;
  eligible.sort((a,b)=>(loads.get(a.id)??0)-(loads.get(b.id)??0)||Number(a.id===last)-Number(b.id===last)||t.rotationIds!.indexOf(a.id)-t.rotationIds!.indexOf(b.id));
  if(eligible[0]){t.balancedAssignment={occurrenceKey:p.occurrenceKey,memberId:eligible[0].id};t.revision=(t.revision??0)+1;loads.set(eligible[0].id,(loads.get(eligible[0].id)??0)+effort(t));}
 }
}
export function needsLifeUpdate(h:Household,now:Date){const before=JSON.stringify(h.tasks);normalizeLife(h,now);return before!==JSON.stringify(h.tasks);}
export function lifeView(h:Household,m:Member,now:Date){const day=localDay(now);return {away:m.away??null,crewAway:h.away??null,paused:awayOn(h.away,day)||awayOn(m.away,day),decor:decorationView(h)};}
export function updateEffort(h:Household,e:HistoryEvent){const m=h.members.find(m=>m.id===e.userId);if(!m)return;if(e.kind==='completion'||e.kind==='correction'){const key=weekKey(new Date(e.originalCreatedAt??e.createdAt));m.effortWeeks??={};m.effortWeeks[key]=Math.max(0,(m.effortWeeks[key]??0)+(e.effort??0)*(e.kind==='correction'?-1:1));}}
export function lifeChange(route:string,method:string,body:unknown,h:Household,m:Member,now:Date){
 if((route==='/profile/away'||route==='/household/away')&&['PATCH','DELETE'].includes(method)){
  const crew=route.startsWith('/household');if(crew)admin(m);const target=crew?h:m,today=localDay(now),old=target.away;
  // Preserve skipped recurring rounds before replacing the previous interval.
  if(old&&old.from<=today){const through=old.until&&old.until<today?old.until:addDays(today,-1);for(const t of h.tasks)if(t.cadence!=='once'&&(crew||!t.rotationIds?.length&&t.assignedTo===m.id||t.rotationIds?.includes(m.id)&&['paused','upcoming'].includes(taskPlan(h,t,today).status)&&['today','overdue'].includes(plan(t,today,t.createdOn??today).status)))t.skipThrough=[t.skipThrough??'',through].sort().at(-1);}
  if(method==='DELETE'){target.away=old&&old.from<today?{from:old.from,until:addDays(today,-1)}:null;}
  else {const v=z.object({from:z.string(),until:z.string().nullable()}).strict().parse(body);if(!validDay(v.from)||v.from<today||v.until&&(!validDay(v.until)||v.until<v.from))throw new AppError(400,'Wähle eine Auszeit ab heute mit passendem Enddatum.');target.away=v;}
  for(const t of h.tasks){if(crew||t.assignedTo===m.id||t.rotationIds?.includes(m.id)||t.team?.shares.some(s=>s.userId===m.id)){t.revision=(t.revision??0)+1;delete t.handover;if(awayOn(target.away,today))clearTeam(h,t);}}
  normalizeLife(h,now);return {result:{ok:true},event:{id:crypto.randomUUID(),kind:'pause',userId:m.id,name:m.name,title:`${crew?'Crew':m.name}: Auszeit ${method==='DELETE'?'beendet':'geplant'}`,createdAt:now.toISOString()} as HistoryEvent};
 }
 if(route==='/station/style'&&method==='PATCH'){
  admin(m);const v=z.object({slot:z.enum(['plant','furniture','window','companion']),itemId:z.string().nullable()}).strict().parse(body);
  if(v.itemId&&!decorationView(h).items.some(d=>d.id===v.itemId&&d.slot===v.slot&&d.unlocked))throw new AppError(403,'Diese Dekoration ist noch nicht freigeschaltet.');
  h.stationStyle??={};h.stationStyle[v.slot]=v.itemId??'';return {result:{ok:true}};
 }
 return null;
}
