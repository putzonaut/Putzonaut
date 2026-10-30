import { z } from 'zod';
import { activeMembers, admin, AppError, nameSchema, newMember, reopenTask } from './domain.ts';
import type { Household, HistoryEvent, Member } from './domain.ts';

export function crewChange(route:string, method:string, body:unknown, h:Household, actor:Member, now:Date):{result:unknown;event:HistoryEvent;removeAccounts?:string[]}|null {
 const matches=route==='/children'||/^\/members\/[^/]+$/.test(route)||['/household/transfer','/household/leave','/household/close'].includes(route);
 if(!matches)return null;
 if(actor.kind==='child')throw new AppError(403,'Wechsle für die Crew-Verwaltung zurück zu deinem eigenen Profil.');
 const members=activeMembers(h);
 const target=()=>{const m=members.find(m=>m.id===route.split('/')[2]);if(!m)throw new AppError(404,'Dieses Crewmitglied ist nicht mehr dabei.');return m;};
 const event=(title:string):HistoryEvent=>({id:crypto.randomUUID(),kind:'crew',title,userId:actor.id,name:actor.name,createdAt:now.toISOString()});
 const archive=(m:Member)=>{m.removedAt=now.toISOString();m.accountId=null;for(const task of h.tasks){if(task.assignedTo===m.id)task.assignedTo=null;task.rotationIds=task.rotationIds?.filter(id=>id!==m.id);if(task.completion?.status==='pending'&&task.completion.userId===m.id)reopenTask(task,now,h.createdAt);}h.pendingCompletions=h.pendingCompletions?.filter(c=>c.userId!==m.id);};
 const checkChildren=(m:Member)=>{if(members.some(child=>child.kind==='child'&&child.guardianId===m.id))throw new AppError(409,'Übertrage zuerst die Begleitung der Kinderprofile an ein anderes Mitglied mit eigenem Konto.');};
 if(route==='/children'&&method==='POST'){
  if(members.length>=12)throw new AppError(409,'Eure Crew hat bereits zwölf aktive Mitglieder.');
  const v=z.object({name:nameSchema}).parse(body);const child=newMember(null,v.name,'member',now);child.guardianId=actor.id;h.members.push(child);
  return {result:{id:child.id},event:event(`${child.name} ist als Kinderprofil an Bord`)};
 }
 if(/^\/members\/[^/]+$/.test(route)&&method==='PATCH'){
  const child=target();if(child.kind!=='child')throw new AppError(400,'Mitglieder mit eigenem Konto ändern ihren Namen selbst.');
  if(actor.role!=='admin'&&child.guardianId!==actor.id)throw new AppError(403,'Dieses Kinderprofil verwaltest du nicht.');
  const v=z.object({name:nameSchema,guardianId:z.string().uuid().optional()}).parse(body);
  if(v.guardianId&&v.guardianId!==child.guardianId){admin(actor);if(!members.some(m=>m.id===v.guardianId&&m.kind!=='child'&&m.accountId))throw new AppError(400,'Wähle ein aktives Mitglied mit eigenem Konto.');child.guardianId=v.guardianId;}
  child.name=v.name;return {result:{ok:true},event:event(`Kinderprofil ${child.name} aktualisiert`)};
 }
 if(route==='/household/transfer'&&method==='POST'){
  admin(actor);const v=z.object({memberId:z.string().uuid()}).parse(body);const next=members.find(m=>m.id===v.memberId&&m.id!==actor.id&&m.kind!=='child'&&m.accountId);
  if(!next)throw new AppError(400,'Wähle ein anderes aktives Mitglied mit eigenem Konto.');
  actor.role='member';next.role='admin';h.invites=[];
  return {result:{ok:true},event:event(`${next.name} übernimmt als Captain`)};
 }
 if(route==='/household/close'&&method==='POST'){
  admin(actor);const v=z.object({confirmation:z.string()}).parse(body);if(v.confirmation!==h.name)throw new AppError(400,'Gib zur Bestätigung den vollständigen Crew-Namen ein.');
  const accounts=members.flatMap(m=>m.accountId?[m.accountId]:[]);members.forEach(archive);h.closedAt=now.toISOString();h.invites=[];
  return {result:{ok:true,needsSetup:true},event:event('Crew geschlossen und archiviert'),removeAccounts:accounts};
 }
 if((route==='/household/leave'&&method==='POST')||(/^\/members\/[^/]+$/.test(route)&&method==='DELETE')){
  const leaving=route==='/household/leave';const m=leaving?actor:target();
  if(!leaving&&!(m.kind==='child'&&m.guardianId===actor.id))admin(actor);
  if(m.role==='admin')throw new AppError(409,'Übertrage zuerst die Captain-Rolle oder schließe die Crew.');
  if(!leaving&&m.id===actor.id)throw new AppError(400,'Nutze dafür „Crew verlassen“.');
  checkChildren(m);const account=m.accountId;archive(m);h.invites=[];
  return {result:{ok:true,...(leaving?{needsSetup:true}:{})},event:event(`${m.name} ${leaving?'hat die Crew verlassen':'wurde aus der Crew entfernt'}`),removeAccounts:account?[account]:[]};
 }
 throw new AppError(405,'Diese Aktion ist hier nicht möglich.');
}
