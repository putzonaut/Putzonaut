import { z } from 'zod';
import {backupRoute} from './backups.ts';
import {BACKUP_MAX_BYTES} from './backup-schema.ts';
import {APP_VERSION} from '../src/version.ts';
import {areaChange} from './areas.ts';
import {ensureAreas} from '../shared/workspace.ts';
import {gameChange} from './game.ts';
import {hasUnclaimedAchievements} from './progress.ts';
import {weekKey} from '../shared/planning.ts';
import { missionChange } from './missions.ts';
import { crewChange } from './crew.ts';
import { TASK_TEMPLATES } from '../shared/setup.ts';
import { Repository } from './repository.ts';
import { activeMembers, canUndo, profile, admin, AppError, digest, householdSchema, member, nameSchema, newHousehold, newMember, OUTFITS, randomToken, rewardSchema, view } from './domain.ts';
import type { HistoryEvent, Household, Member } from './domain.ts';

export type Identity={userId:string;fullName?:string|null};
const origin='https://putzonaut-test.denny-subke.chatgpt.site';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
async function readBody(request:Request,limit=16384){
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new AppError(415,'Bitte sende die Anfrage erneut aus Putzonaut.');
 const reader=request.body?.getReader();if(!reader)return {};const chunks:Uint8Array[]=[];let length=0;
 while(true){const item=await reader.read();if(item.done)break;length+=item.value.length;if(length>limit){await reader.cancel();throw new AppError(413,'Die Eingabe ist zu groß.');}chunks.push(item.value);}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new AppError(400,'Die Eingabe konnte nicht gelesen werden.');}
}
export async function handleApi(request:Request,identity:Identity|null,repo:Repository,options:{now?:()=>Date;development?:boolean}={}){
 try{
  const url=new URL(request.url);const route=url.pathname.replace(/^\/api/,'');const method=request.method;
  if(route==='/health'&&method==='GET'){await repo.db.prepare('SELECT 1').first();return json({status:'ok',version:APP_VERSION});}
  if(!identity)return json({error:'Bitte melde dich mit deinem ChatGPT-Konto an.'},401);
  if(!['GET','HEAD'].includes(method)){
   const allowed=options.development?url.origin:origin;
   if(request.headers.get('origin')!==allowed||request.headers.get('sec-fetch-site')==='cross-site')throw new AppError(403,'Diese Anfrage kommt nicht von Putzonaut. Bitte öffne die App erneut.');
  }
  const now=(options.now??(()=>new Date()))();const accountId=identity.userId;
  if(route==='/bootstrap'&&method==='GET'){const row=await repo.forAccount(accountId);return json({needsSetup:!row,signedIn:true,suggestedName:identity.fullName?.split(' ')[0]??''});}
  const body=['POST','PATCH','DELETE'].includes(method)?await readBody(request,['/backups/preview','/backups/restore'].includes(route)?BACKUP_MAX_BYTES+4096:16384):{};
  if(route==='/auth/setup'&&method==='POST'){
   const v=z.object({name:nameSchema,householdName:z.string().trim().min(2).max(60),starterTasks:z.boolean().default(true),kind:z.enum(['family','couple','shared','solo']).default('family'),taskTemplates:z.array(z.string().refine(key=>TASK_TEMPLATES.some(t=>t.key===key))).max(6).optional()}).parse(body);
   const h=newHousehold(accountId,v.name,v.householdName,v.starterTasks,now,v.kind,v.taskTemplates);await repo.create(h);return json({ok:true},201);
  }
  if(route==='/auth/invitation'&&method==='POST'){
   const v=z.object({invite:z.string().regex(/^[0-9a-f-]{36}\.[0-9a-f]{64}$/)}).parse(body);const [id,token]=v.invite.split('.');const row=await repo.byId(id);const house=row?JSON.parse(row.document) as Household:null;const hash=await digest(token);const invite=house?.invites.find(i=>i.hash===hash&&!i.usedAt&&i.expiresAt>now.toISOString());
   if(!house||house.closedAt||!invite)throw new AppError(410,'Diese Einladung ist ungültig, abgelaufen oder wurde schon benutzt.');
   return json({name:house.name,kind:house.kind??'family',memberCount:activeMembers(house).length,expiresAt:invite.expiresAt,full:activeMembers(house).length>=12});
  }
  if(route==='/auth/join'&&method==='POST'){
   const v=z.object({name:nameSchema,invite:z.string().regex(/^[0-9a-f-]{36}\.[0-9a-f]{64}$/)}).parse(body);const [householdId,token]=v.invite.split('.');const hash=await digest(token);
   return json(await repo.join(householdId,accountId,now,h=>{const invitation=h.invites.find(i=>i.hash===hash&&!i.usedAt&&i.expiresAt>now.toISOString());if(!invitation)throw new AppError(410,'Diese Einladung ist abgelaufen oder wurde schon benutzt.');if(activeMembers(h).length>=12)throw new AppError(409,'Eure Crew hat bereits zwölf Mitglieder.');const joined=newMember(accountId,v.name,'member',now);h.members.push(joined);invitation.usedAt=now.toISOString();return joined.id;}),201);
  }
  const row=await repo.forAccount(accountId);if(!row)throw new AppError(404,'Richte zuerst deine Crew ein.');const h=JSON.parse(row.document) as Household;const viewer=member(h,accountId);const profileId=request.headers.get('X-Putzonaut-Profile');const actor=profile(h,accountId,profileId);const expected={householdId:h.id,memberId:viewer.id,restoreEpoch:h.restoreEpoch};
  if(!['GET','HEAD'].includes(method)&&request.headers.has('X-Putzonaut-Household')&&request.headers.get('X-Putzonaut-Household')!==h.id)throw new AppError(409,'Deine Crew hat sich geändert. Bitte lade die Seite neu.');
  if(!['GET','HEAD'].includes(method)&&(request.headers.get('X-Putzonaut-Epoch')??'')!==(h.restoreEpoch??''))throw new AppError(409,'Eure Crew wurde wiederhergestellt. Bitte lade den aktuellen Stand, bevor du etwas änderst.');
  const backupResponse=await backupRoute(route,method,body,repo,accountId,profileId,row,now);if(backupResponse)return backupResponse;
  if(route==='/state'&&method==='GET'){if(!h.areas||!h.game?.weeks[weekKey(now)]||h.members.some(m=>!m.career)||hasUnclaimedAchievements(h)){await repo.mutate(accountId,now,()=>({result:null}),expected);const fresh=await repo.forAccount(accountId);if(!fresh)throw new AppError(404,'Deine Crew-Mitgliedschaft hat sich geändert.');return json(view(JSON.parse(fresh.document),accountId,now,await repo.history(fresh.id,0,50),fresh.revision,profileId));}return json(view(h,accountId,now,await repo.history(h.id,0,50),row.revision,profileId));}
  if(route==='/history'&&method==='GET'){const offset=z.coerce.number().int().min(0).max(100000).parse(url.searchParams.get('offset')??0);const events=await repo.history(h.id,offset,51);return json({items:events.slice(0,50).map(e=>({...e,canUndo:canUndo(h,actor,e)})),nextOffset:events.length>50?offset+50:null});}
  if(route==='/export'&&method==='GET'){
   admin(actor);ensureAreas(h);const snapshot={format:'putzonaut-export',version:5,areas:h.areas,exportedAt:now.toISOString(),household:{id:h.id,name:h.name,kind:h.kind??'family',goalTitle:h.goalTitle,weekGoal:h.weekGoal,timezone:h.timezone,weekKey:h.weekKey},members:h.members.map(({accountId:_,...m})=>m),tasks:h.tasks,pendingCompletions:h.pendingCompletions??[],game:h.game??null,rewards:h.rewards,redemptions:h.redemptions};
   return new Response(JSON.stringify(snapshot,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="putzonaut-${now.toISOString().slice(0,10)}.json"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(route==='/invitations'&&method==='GET'){admin(actor);return json({items:h.invites.filter(i=>!i.usedAt&&i.expiresAt>now.toISOString()).map(({hash:_,...i})=>i)});}
  const id=route.split('/')[2];
  if(route==='/invitations'&&method==='POST'){
   const token=randomToken();const hash=await digest(token);const invitationId=crypto.randomUUID();
   await repo.mutate(accountId,now,house=>{admin(profile(house,accountId,profileId));house.invites=house.invites.filter(i=>!i.usedAt&&i.expiresAt>now.toISOString());if(house.invites.length>=10)throw new AppError(409,'Es sind bereits zehn Einladungen offen. Widerrufe zuerst eine alte Einladung.');house.invites.push({id:invitationId,hash,expiresAt:new Date(now.getTime()+7*86400000).toISOString(),usedAt:null});return {result:{ok:true}};},expected);
   return json({token:`${h.id}.${token}`,expiresInDays:7},201);
  }
  if(/^\/rewards\/[^/]+\/redeem$/.test(route)&&method==='POST'){
   const key=z.object({requestKey:z.string().uuid()}).parse(body).requestKey;const existing=await repo.existingRequest(actor.id,key);
   if(existing){if(existing.rewardId!==id)throw new AppError(409,'Diese Einlösung gehört zu einer anderen Belohnung.');return json(existing.redemption);}
  }
  const result=await repo.mutate<unknown>(accountId,now,async house=>{
   const user=profile(house,accountId,profileId);const requireAdmin=()=>admin(user);
   const area=areaChange(route,method,body,house,user);if(area)return area;
   const game=gameChange(route,method,body,house,user,now);if(game)return game;
   const mission=await missionChange(route,method,body,house,user,member(house,accountId),now,repo);if(mission)return mission;
   const crew=crewChange(route,method,body,house,user,now);if(crew)return crew;
   const find=<T extends {id:string}>(items:T[])=>{const item=items.find(i=>i.id===id);if(!item)throw new AppError(404,'Dieser Eintrag wurde nicht gefunden.');return item;};
   const event=(kind:string,title:string,extra:Partial<HistoryEvent>={}):HistoryEvent=>({id:crypto.randomUUID(),kind,title,userId:user.id,name:user.name,createdAt:now.toISOString(),...(user.id!==viewer.id?{recordedBy:viewer.id,recordedByName:viewer.name}:{}),...extra});
   if(route==='/profile'&&method==='PATCH'){user.name=z.object({name:nameSchema}).parse(body).name;return {result:{ok:true}};}
   if(route==='/rewards'&&method==='POST'){requireAdmin();if(house.rewards.length>=100)throw new AppError(409,'Bitte archiviere zuerst einen alten Wunsch.');const reward={...rewardSchema.parse(body),id:crypto.randomUUID()};house.rewards.push(reward);return {result:{id:reward.id}};}
   if(/^\/rewards\/[^/]+$/.test(route)&&method==='PATCH'){requireAdmin();Object.assign(find(house.rewards),rewardSchema.parse(body));return {result:{ok:true}};}
   if(/^\/rewards\/[^/]+$/.test(route)&&method==='DELETE'){requireAdmin();find(house.rewards);house.rewards=house.rewards.filter(r=>r.id!==id);house.members.forEach(m=>{if(m.savingRewardId===id)m.savingRewardId=null;});return {result:{ok:true}};}
   if(/^\/rewards\/[^/]+\/redeem$/.test(route)&&method==='POST'){
    const key=z.object({requestKey:z.string().uuid()}).parse(body).requestKey;const previous=house.redemptions.find(r=>r.user_id===user.id&&r.request_key===key);
    if(previous){if(previous.reward_id!==id)throw new AppError(409,'Diese Einlösung gehört zu einem anderen Wunsch.');return {result:previous};}
    const reward=find(house.rewards);if(user.stars<reward.cost)throw new AppError(409,'Für diesen Wunsch fehlen dir noch Sterne.');user.stars-=reward.cost;if(user.savingRewardId===id)user.savingRewardId=null;
    const redemption={id:crypto.randomUUID(),user_id:user.id,reward_id:reward.id,request_key:key,title:reward.title,cost:reward.cost,user_name:user.name,created_at:now.toISOString(),fulfilled_at:null};house.redemptions.unshift(redemption);
    return {result:redemption,event:event('redemption',reward.title,{stars:-reward.cost,rewardId:reward.id,requestKey:key,redemption})};
   }
   if(/^\/redemptions\/[^/]+\/fulfill$/.test(route)&&method==='POST'){requireAdmin();const r=find(house.redemptions);r.fulfilled_at??=now.toISOString();return {result:{ok:true}};}
   if(/^\/outfits\/[^/]+\/equip$/.test(route)&&method==='POST'){
    const outfit=find(OUTFITS);if(outfit.achievement&&!user.achievements?.includes(outfit.achievement))throw new AppError(403,'Erreiche zuerst den Meilenstein für diesen Anzug.');if(!user.unlocked.includes(outfit.id)){if(Math.floor(user.xp/500)+1<outfit.level)throw new AppError(409,`Diesen Anzug gibt es ab Level ${outfit.level}.`);if(user.stars<outfit.cost)throw new AppError(409,'Dir fehlen noch Sterne für diesen Anzug.');user.stars-=outfit.cost;user.unlocked.push(outfit.id);}user.outfit=outfit.id;return {result:{ok:true}};
   }
   if(route==='/household'&&method==='PATCH'){requireAdmin();Object.assign(house,householdSchema.parse(body));return {result:{ok:true}};}
   if(/^\/invitations\/[^/]+$/.test(route)&&method==='DELETE'){requireAdmin();find(house.invites);house.invites=house.invites.filter(i=>i.id!==id);return {result:{ok:true}};}
   throw new AppError(404,'Diese Funktion wurde nicht gefunden.');
  },expected);
  return json(result);
 }catch(error){
  if(error instanceof AppError)return json({error:error.message},error.status);
  if(error instanceof z.ZodError)return json({error:'Bitte prüfe deine Eingaben.'},400);
  console.error(JSON.stringify({event:'api_error',path:new URL(request.url).pathname,message:error instanceof Error?error.message:'unknown'}));
  return json({error:'Das hat gerade nicht geklappt. Deine Änderung wurde nicht bestätigt. Bitte versuche es erneut.'},500);
 }
}
