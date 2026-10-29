import { z } from 'zod';
import { HOUSEHOLD_TYPES, TASK_TEMPLATES } from '../shared/setup.ts';
import type { HouseholdKind } from '../shared/setup.ts';

export class AppError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status;} }
export const nameSchema=z.string().trim().min(1).max(40);
export const taskSchema=z.object({title:z.string().trim().min(2).max(80),room:z.enum(['Küche','Wohnen','Bad','Haushalt']),icon:z.enum(['vacuum','dishes','laundry','plant','bath','trash','sparkles']),minutes:z.number().int().min(1).max(180),xp:z.number().int().min(1).max(1000),stars:z.number().int().min(0).max(500),cadence:z.enum(['once','daily','weekly']),assignedTo:z.string().nullable().optional().default(null),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null)});
export const rewardSchema=z.object({title:z.string().trim().min(2).max(60),cost:z.number().int().min(1).max(10000),icon:z.enum(['film','ice','meal','gift'])});
export const householdSchema=z.object({name:z.string().trim().min(2).max(60),goalTitle:z.string().trim().min(2).max(80),weekGoal:z.number().int().min(1).max(500),kind:z.enum(['family','couple','shared','solo']).optional()});
export const OUTFITS=[{id:'starter',title:'Starter',cost:0,level:1},{id:'comet',title:'Komet',cost:300,level:1},{id:'sun',title:'Sonnenheld',cost:0,level:8}];
export type Member={id:string;accountId:string|null;kind?:'account'|'child';guardianId?:string|null;removedAt?:string|null;name:string;role:'admin'|'member';xp:number;stars:number;outfit:string;unlocked:string[];completedCount:number;weekCount:number;joinedAt:string};
export type Completion={occurrenceKey:string;userId:string;user_name:string;created_at:string;xp:number;stars:number};
export type Task=z.infer<typeof taskSchema>&{id:string;completion:Completion|null};
export type Reward=z.infer<typeof rewardSchema>&{id:string};
export type Redemption={id:string;user_id:string;reward_id:string;request_key:string;title:string;cost:number;user_name:string;created_at:string;fulfilled_at:string|null};
export type Invite={id:string;hash:string;expiresAt:string;usedAt:string|null};
export type Household={schema:1;kind?:HouseholdKind;closedAt?:string|null;id:string;name:string;goalTitle:string;weekGoal:number;weekKey:string;timezone:string;members:Member[];tasks:Task[];rewards:Reward[];redemptions:Redemption[];invites:Invite[];lastMutation:string;createdAt:string};
export type HistoryEvent={id:string;kind:string;userId:string;name:string;title:string;createdAt:string;xp?:number;stars?:number;rewardId?:string;requestKey?:string;redemption?:Redemption;recordedBy?:string;recordedByName?:string};
export function localDay(date:Date){const parts=new Intl.DateTimeFormat('en',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const p=(type:string)=>parts.find(p=>p.type===type)!.value;return `${p('year')}-${p('month')}-${p('day')}`;}
export function weekKey(date:Date){const d=new Date(`${localDay(date)}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
export function occurrenceKey(cadence:string,date:Date){return cadence==='once'?'once':cadence==='weekly'?weekKey(date):localDay(date);}
export function normalize(h:Household,now:Date){const week=weekKey(now);if(h.weekKey!==week){h.weekKey=week;h.members.forEach(m=>m.weekCount=0);}}
export function publicMember(m:Member){return {id:m.id,name:m.name,username:'',role:m.role,kind:m.kind??'account',guardianId:m.guardianId??null,xp:m.xp,stars:m.stars,outfit:m.outfit,level:Math.floor(m.xp/500)+1,levelXp:m.xp%500,nextLevelXp:500,weekCount:m.weekCount};}
export function member(h:Household,accountId:string){const m=h.members.find(m=>m.accountId===accountId&&!m.removedAt);if(!m||h.closedAt)throw new AppError(403,'Du gehörst nicht zu dieser Crew.');return m;}
export function admin(m:Member){if(m.role!=='admin')throw new AppError(403,'Das kann nur der Captain eurer Crew.');}
export function newMember(accountId:string|null,name:string,role:Member['role'],now:Date):Member{return {id:crypto.randomUUID(),accountId,kind:accountId?'account':'child',guardianId:null,removedAt:null,name,role,xp:0,stars:0,outfit:'starter',unlocked:['starter'],completedCount:0,weekCount:0,joinedAt:now.toISOString()};}
export const activeMembers = (h:Household) => h.members.filter(m=>!m.removedAt);
export function profile(h:Household, accountId:string, profileId?:string|null) {
 const actor=member(h,accountId);
 if(!profileId||profileId===actor.id)return actor;
 const child=activeMembers(h).find(m=>m.id===profileId&&m.kind==='child');
 if(!child||(actor.role!=='admin'&&child.guardianId!==actor.id))throw new AppError(403,'Dieses Kinderprofil kannst du nicht begleiten.');
 return child;
}
export function newHousehold(accountId:string,name:string,crew:string,starterTasks:boolean,now:Date,kind:HouseholdKind='family',templates?:string[]):Household{
 const selected=templates??(starterTasks?TASK_TEMPLATES.map(t=>t.key):[]);
 const tasks:Task[]=TASK_TEMPLATES.filter(t=>selected.includes(t.key)).map(t=>({...taskSchema.parse(t),id:crypto.randomUUID(),completion:null}));
 return {schema:1,kind,closedAt:null,id:crypto.randomUUID(),name:crew,goalTitle:kind==='solo'?'Zeit für meinen Lieblingsfilm':'Gemeinsam zum Filmabend',weekGoal:HOUSEHOLD_TYPES.find(t=>t.id===kind)!.goal,weekKey:weekKey(now),timezone:'Europe/Berlin',members:[newMember(accountId,name,'admin',now)],tasks,rewards:[],redemptions:[],invites:[],lastMutation:'',createdAt:now.toISOString()};
}
export function view(h:Household,accountId:string,now:Date,events:HistoryEvent[],revision:number,profileId?:string|null){
 normalize(h,now);const viewer=member(h,accountId);const user=profile(h,accountId,profileId);const members=activeMembers(h);
 return {user:publicMember(user),viewer:publicMember(viewer),household:{id:h.id,name:h.name,kind:h.kind??'family',goalTitle:h.goalTitle,weekGoal:h.weekGoal,timezone:h.timezone,weekCount:h.members.reduce((n,m)=>n+m.weekCount,0)},tasks:h.tasks.map(t=>({...t,occurrenceKey:occurrenceKey(t.cadence,now),completion:t.completion?.occurrenceKey===occurrenceKey(t.cadence,now)?t.completion:null,assignedName:members.find(m=>m.id===t.assignedTo)?.name??null,overdue:!!t.dueDate&&t.dueDate<localDay(now)&&t.completion?.occurrenceKey!==occurrenceKey(t.cadence,now)})),members:members.map(publicMember),rewards:h.rewards,redemptions:h.redemptions.filter(r=>user.role==='admin'||r.user_id===user.id),outfits:OUTFITS.map(o=>({...o,unlocked:user.unlocked.includes(o.id)})),recent:events.filter(e=>e.kind==='completion').slice(0,8).map(e=>({id:e.id,title:e.title,name:e.name,createdAt:e.createdAt})),completedCount:user.completedCount,revision,syncedAt:now.toISOString()};
}
export async function digest(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function randomToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');}
