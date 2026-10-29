import { z } from 'zod';

export class AppError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status;} }
export const nameSchema=z.string().trim().min(1).max(40);
export const taskSchema=z.object({title:z.string().trim().min(2).max(80),room:z.enum(['Küche','Wohnen','Bad','Haushalt']),icon:z.enum(['vacuum','dishes','laundry','plant','bath','trash','sparkles']),minutes:z.number().int().min(1).max(180),xp:z.number().int().min(1).max(1000),stars:z.number().int().min(0).max(500),cadence:z.enum(['once','daily','weekly']),assignedTo:z.string().nullable().optional().default(null),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null)});
export const rewardSchema=z.object({title:z.string().trim().min(2).max(60),cost:z.number().int().min(1).max(10000),icon:z.enum(['film','ice','meal','gift'])});
export const householdSchema=z.object({name:z.string().trim().min(2).max(60),goalTitle:z.string().trim().min(2).max(80),weekGoal:z.number().int().min(1).max(500)});
export const OUTFITS=[{id:'starter',title:'Starter',cost:0,level:1},{id:'comet',title:'Komet',cost:300,level:1},{id:'sun',title:'Sonnenheld',cost:0,level:8}];
export type Member={id:string;accountId:string;name:string;role:'admin'|'member';xp:number;stars:number;outfit:string;unlocked:string[];completedCount:number;weekCount:number;joinedAt:string};
export type Completion={occurrenceKey:string;userId:string;user_name:string;created_at:string;xp:number;stars:number};
export type Task=z.infer<typeof taskSchema>&{id:string;completion:Completion|null};
export type Reward=z.infer<typeof rewardSchema>&{id:string};
export type Redemption={id:string;user_id:string;reward_id:string;request_key:string;title:string;cost:number;user_name:string;created_at:string;fulfilled_at:string|null};
export type Invite={id:string;hash:string;expiresAt:string;usedAt:string|null};
export type Household={schema:1;id:string;name:string;goalTitle:string;weekGoal:number;weekKey:string;timezone:string;members:Member[];tasks:Task[];rewards:Reward[];redemptions:Redemption[];invites:Invite[];lastMutation:string;createdAt:string};
export type HistoryEvent={id:string;kind:string;userId:string;name:string;title:string;createdAt:string;xp?:number;stars?:number;rewardId?:string;requestKey?:string;redemption?:Redemption};
export function localDay(date:Date){const parts=new Intl.DateTimeFormat('en',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const p=(type:string)=>parts.find(p=>p.type===type)!.value;return `${p('year')}-${p('month')}-${p('day')}`;}
export function weekKey(date:Date){const d=new Date(`${localDay(date)}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
export function occurrenceKey(cadence:string,date:Date){return cadence==='once'?'once':cadence==='weekly'?weekKey(date):localDay(date);}
export function normalize(h:Household,now:Date){const week=weekKey(now);if(h.weekKey!==week){h.weekKey=week;h.members.forEach(m=>m.weekCount=0);}}
export function publicMember(m:Member){return {id:m.id,name:m.name,username:'',role:m.role,xp:m.xp,stars:m.stars,outfit:m.outfit,level:Math.floor(m.xp/500)+1,levelXp:m.xp%500,nextLevelXp:500,weekCount:m.weekCount};}
export function member(h:Household,accountId:string){const m=h.members.find(m=>m.accountId===accountId);if(!m)throw new AppError(403,'Du gehörst nicht zu dieser Crew.');return m;}
export function admin(m:Member){if(m.role!=='admin')throw new AppError(403,'Das kann nur der Captain eurer Crew.');}
export function newMember(accountId:string,name:string,role:Member['role'],now:Date):Member{return {id:crypto.randomUUID(),accountId,name,role,xp:0,stars:0,outfit:'starter',unlocked:['starter'],completedCount:0,weekCount:0,joinedAt:now.toISOString()};}
export function newHousehold(accountId:string,name:string,crew:string,starterTasks:boolean,now:Date):Household{
 const tasks:Task[]=starterTasks?[['Staubsaugen','Wohnen','vacuum',15,60,20,'daily'],['Spülmaschine einräumen','Küche','dishes',8,40,15,'daily'],['Wäsche aufhängen','Haushalt','laundry',10,50,15,'daily'],['Pflanzen gießen','Wohnen','plant',5,25,10,'weekly'],['Bad zum Strahlen bringen','Bad','bath',20,80,25,'weekly'],['Müll rausbringen','Haushalt','trash',5,25,10,'daily']].map(t=>({...taskSchema.parse({title:t[0],room:t[1],icon:t[2],minutes:t[3],xp:t[4],stars:t[5],cadence:t[6]}),id:crypto.randomUUID(),completion:null})):[];
 return {schema:1,id:crypto.randomUUID(),name:crew,goalTitle:'Gemeinsam zum Filmabend',weekGoal:24,weekKey:weekKey(now),timezone:'Europe/Berlin',members:[newMember(accountId,name,'admin',now)],tasks,rewards:[],redemptions:[],invites:[],lastMutation:'',createdAt:now.toISOString()};
}
export function view(h:Household,accountId:string,now:Date,events:HistoryEvent[],revision:number){normalize(h,now);const user=member(h,accountId);return {user:publicMember(user),household:{id:h.id,name:h.name,goalTitle:h.goalTitle,weekGoal:h.weekGoal,timezone:h.timezone,weekCount:h.members.reduce((n,m)=>n+m.weekCount,0)},tasks:h.tasks.map(t=>({...t,occurrenceKey:occurrenceKey(t.cadence,now),completion:t.completion?.occurrenceKey===occurrenceKey(t.cadence,now)?t.completion:null,assignedName:h.members.find(m=>m.id===t.assignedTo)?.name??null,overdue:!!t.dueDate&&t.dueDate<localDay(now)&&t.completion?.occurrenceKey!==occurrenceKey(t.cadence,now)})),members:h.members.map(publicMember),rewards:h.rewards,redemptions:h.redemptions.filter(r=>user.role==='admin'||r.user_id===user.id),outfits:OUTFITS.map(o=>({...o,unlocked:user.unlocked.includes(o.id)})),recent:events.filter(e=>e.kind==='completion').slice(0,8).map(e=>({id:e.id,title:e.title,name:e.name,createdAt:e.createdAt})),completedCount:user.completedCount,revision,syncedAt:now.toISOString()};}
export async function digest(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function randomToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');}
