import {durationSuggestion,trophyView} from '../shared/comfort.ts';
import { z } from 'zod';
import {normalizeLife,lifeView,taskPlan,taskOwner} from './life.ts';
import type {TeamMission,StationStyle} from '../shared/life.ts';
import {REWARD_ICON_IDS} from '../shared/reward-icons.ts';
import type {Reminder,Handover} from '../shared/everyday.ts';
import {everydayView} from './everyday.ts';
import type {CleaningRound,Routine} from '../shared/rounds.ts';
import type {CrewWish,StarChange} from '../shared/crew-wish.ts';
import {roundView} from './rounds.ts';
import {ensureAreas,createWeekPlan} from '../shared/workspace.ts';
import type {Area,ChecklistStep} from '../shared/workspace.ts';
import {ensureProgress,progressView} from './progress.ts';
import {GAME_OUTFITS,ACHIEVEMENTS} from '../shared/game.ts';
import type {GameProgress} from '../shared/game.ts';
import { localDay, weekKey, plan, assignment, CADENCES } from '../shared/planning.ts';
import type { Pause,Postponement } from '../shared/planning.ts';
export { localDay, weekKey } from '../shared/planning.ts';
import { TASK_TEMPLATES, DEFAULT_STARTER_TEMPLATE_KEYS, setupGoals } from '../shared/setup.ts';
import {TASK_ICON_IDS} from '../shared/task-icons.ts';
import {CATEGORY_IDS} from '../shared/categories.ts';
import type {Career} from './career.ts';
import type {TemplateCategory} from '../shared/setup.ts';
import type { HouseholdKind } from '../shared/setup.ts';

export class AppError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status;} }
export const nameSchema=z.string().trim().min(1).max(40);
export const taskSchema=z.object({knowledge:z.string().trim().max(1200).optional(),rotationMode:z.enum(['weekly','balanced']).optional(),category:z.enum(CATEGORY_IDS).optional(),title:z.string().trim().min(2).max(80),room:z.string().trim().min(1).max(40),areaId:z.string().min(1).max(40).optional(),steps:z.array(z.object({id:z.string().uuid().optional(),title:z.string().trim().min(1).max(80)})).max(12).optional(),icon:z.enum(TASK_ICON_IDS),difficulty:z.enum(['easy','normal','hard']).optional(),minutes:z.number().int().min(1).max(180),xp:z.number().int().min(1).max(1000),stars:z.number().int().min(0).max(500),cadence:z.enum(CADENCES),schedule:z.object({intervalMonths:z.union([z.literal(2),z.literal(3),z.literal(6)]).optional(),monthWeek:z.union([z.literal(-1),z.literal(1),z.literal(2),z.literal(3),z.literal(4)]).optional(),monthWeekday:z.number().int().min(1).max(7).optional(),intervalDays:z.number().int().min(1).max(365).optional(),startDate:z.string().optional(),weekdays:z.array(z.number().int().min(1).max(7)).max(7).optional(),intervalWeeks:z.number().int().min(1).max(12).optional(),monthDay:z.number().int().min(1).max(31).optional()}).optional(),rotationIds:z.array(z.string()).max(12).optional(),approvalForChildren:z.boolean().optional(),assignedTo:z.string().nullable().optional().default(null),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null)});
export const rewardSchema=z.object({title:z.string().trim().min(2).max(60),cost:z.number().int().min(1).max(10000),icon:z.enum(REWARD_ICON_IDS)});
export const householdSchema=z.object({name:z.string().trim().min(2).max(60),goalTitle:z.string().trim().min(2).max(80),weekGoal:z.number().int().min(1).max(500),kind:z.enum(['family','couple','shared','solo']).optional()});
export const OUTFITS=GAME_OUTFITS;
export type Member={away?:Pause|null;effortWeeks?:Record<string,number>;reminder?:Reminder;recapDismissedWeek?:string;round?:CleaningRound|null;animations?:boolean;career?:Career;focusAchievementId?:string|null;savingRewardId?:string|null;personalGoal?:number;titleId?:string|null;patchId?:string|null;achievements?:string[];gameStats?:{kitchen:number;plants:number};id:string;accountId:string|null;kind?:'account'|'child';guardianId?:string|null;removedAt?:string|null;name:string;role:'admin'|'member';xp:number;stars:number;outfit:string;unlocked:string[];completedCount:number;weekCount:number;joinedAt:string};
export type Completion={steps?:ChecklistStep[];id?:string;status?:'pending'|'approved';occurrenceKey:string;userId:string;user_name:string;created_at:string;xp:number;stars:number};
export type Task=Omit<z.infer<typeof taskSchema>,'steps'>&{postponement?:Postponement;knowledgePhoto?:string;reopenedDue?:string;durationSamples?:import('../shared/comfort.ts').DurationSample[];durationDismissed?:string;team?:TeamMission;balancedAssignment?:{occurrenceKey:string;memberId:string};revision?:number;handover?:Handover;roundAssignment?:{occurrenceKey:string;memberId:string};steps?:ChecklistStep[];checklistVersion?:number;checklist?:{occurrenceKey:string;doneIds:string[]}|null;id:string;createdOn?:string;rotationStart?:string;pause?:Pause|null;skipThrough?:string|null;completion:Completion|null};
export type Reward=z.infer<typeof rewardSchema>&{id:string};
export type Redemption={shared?:boolean;contributors?:StarChange[];id:string;user_id:string;reward_id:string;request_key:string;title:string;cost:number;user_name:string;created_at:string;fulfilled_at:string|null};
export type Invite={id:string;hash:string;expiresAt:string;usedAt:string|null};
export type PendingCompletion={minutes?:number;effort?:number;teamId?:string;category?:TemplateCategory;steps?:ChecklistStep[];id:string;taskId:string;title:string;occurrenceKey:string;userId:string;name:string;createdAt:string;xp:number;stars:number;recordedBy?:string;recordedByName?:string;room?:string;icon?:string};
export type Household={trophies?:import('../shared/comfort.ts').Trophy[];away?:Pause|null;stationStyle?:StationStyle;routines?:Routine[];crewWish?:CrewWish|null;restoreEpoch?:string;areas?:Area[];game?:GameProgress;pendingCompletions?:PendingCompletion[];schema:1;kind?:HouseholdKind;closedAt?:string|null;id:string;name:string;goalTitle:string;weekGoal:number;weekKey:string;timezone:string;members:Member[];tasks:Task[];rewards:Reward[];redemptions:Redemption[];invites:Invite[];lastMutation:string;createdAt:string};
export type HistoryEvent={minutes?:number;completionId?:string;rating?:number;thanks?:{userId:string;name:string}[];teamId?:string;teamEventIds?:string[];effort?:number;operation?:string;wishId?:string;starChanges?:StarChange[];category?:TemplateCategory;steps?:ChecklistStep[];room?:string;icon?:string;progressTracked?:boolean;originalCreatedAt?:string;reverses?:string;bonusChanges?:{userId:string;name:string;stars:number;week:string}[];id:string;kind:string;userId:string;name:string;title:string;createdAt:string;xp?:number;stars?:number;rewardId?:string;requestKey?:string;redemption?:Redemption;recordedBy?:string;recordedByName?:string;taskId?:string;occurrenceKey?:string;approvalRequired?:boolean;reversed?:boolean;canUndo?:boolean};
export function occurrenceKey(cadence:string,date:Date){return cadence==='once'?'once':cadence==='weekly'?weekKey(date):localDay(date);}
export function normalize(h:Household,now:Date){ensureAreas(h);const week=weekKey(now);if(h.weekKey!==week){h.weekKey=week;h.members.forEach(m=>m.weekCount=0);}ensureProgress(h,now);normalizeLife(h,now);}
export function publicMember(m:Member){return {away:m.away??null,animations:m.animations??true,id:m.id,name:m.name,titleId:m.titleId??null,patchId:m.patchId??null,title:ACHIEVEMENTS.find(a=>a.id===m.titleId)?.title??null,patch:ACHIEVEMENTS.find(a=>a.id===m.patchId)?.patch??null,username:'',role:m.role,kind:m.kind??'account',guardianId:m.guardianId??null,xp:m.xp,stars:m.stars,outfit:m.outfit,level:Math.floor(m.xp/500)+1,levelXp:m.xp%500,nextLevelXp:500,weekCount:m.weekCount};}
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
 const selected=templates??(starterTasks?DEFAULT_STARTER_TEMPLATE_KEYS:[]);
 const tasks:Task[]=TASK_TEMPLATES.filter(t=>selected.includes(t.key)).map(t=>({...taskSchema.parse({...t,steps:undefined}),steps:(t.steps??[]).map(title=>({id:crypto.randomUUID(),title})),id:crypto.randomUUID(),createdOn:localDay(now),completion:null}));
 const goals=setupGoals(kind,selected,localDay(now)),key=weekKey(now);
 return {schema:1,kind,closedAt:null,id:crypto.randomUUID(),name:crew,goalTitle:kind==='solo'?'Mehr Zeit für mich':'Gemeinsam mehr freie Zeit',weekGoal:goals.followingWeeks,weekKey:key,game:{since:now.toISOString(),weeks:{[key]:{key,goal:goals.firstWeek,count:0,quest:null}},questTemplate:null,legacyStationStage:0},timezone:'Europe/Berlin',members:[newMember(accountId,name,'admin',now)],tasks,rewards:[],redemptions:[],invites:[],lastMutation:'',createdAt:now.toISOString()};
}
export function view(h:Household,accountId:string,now:Date,events:HistoryEvent[],revision:number,profileId?:string|null){
 normalize(h,now);const viewer=member(h,accountId);const user=profile(h,accountId,profileId);const members=activeMembers(h);const game=progressView(h,user,now);
 return {trophies:trophyView(h),life:lifeView(h,user,now),everyday:everydayView(h,user,now),round:roundView(h,user,now),routines:h.routines??[],crewWish:h.crewWish??null,areas:h.areas!,planner:createWeekPlan(h.tasks,localDay(now),localDay(new Date(h.createdAt)),members.map(m=>m.id),{plan:(t,day)=>taskPlan(h,t as Task,day),owner:(t,day)=>taskOwner(h,t as Task,day)}),user:publicMember(user),viewer:publicMember(viewer),household:{id:h.id,name:h.name,kind:h.kind??'family',goalTitle:h.goalTitle,weekGoal:game.station.current.goal,nextWeekGoal:h.weekGoal,timezone:h.timezone,weekCount:h.members.reduce((n,m)=>n+m.weekCount,0)},tasks:h.tasks.map(t=>{const p=taskPlan(h,t,localDay(now));const assigned=taskOwner(h,t,localDay(now));const completion=t.completion?.occurrenceKey===p.occurrenceKey?t.completion:null;const steps=completion?completion.steps??[]:t.steps??[];const doneIds=completion?steps.map(s=>s.id):t.checklist?.occurrenceKey===p.occurrenceKey?t.checklist.doneIds:[];return {...t,...p,durationSuggestion:durationSuggestion(t),roomIcon:h.areas!.find(a=>a.id===t.areaId)?.icon??'home',checklist:{version:t.checklistVersion??0,occurrenceKey:p.occurrenceKey,steps,doneIds},completion,effectiveAssignedTo:assigned,assignedName:members.find(m=>m.id===assigned)?.name??null};}),pendingCompletions:(h.pendingCompletions??[]).filter(p=>p.userId===user.id||canManageChild(h,user,p.userId)).map(p=>({...p,canReview:canManageChild(h,user,p.userId)})),members:members.map(publicMember),rewards:h.rewards,redemptions:h.redemptions.filter(r=>r.shared||user.role==='admin'||r.user_id===user.id),game,outfits:game.outfits,recent:events.filter(e=>e.kind==='completion'&&!e.reversed).slice(0,8).map(e=>({id:e.id,userId:e.userId,title:e.title,name:e.name,createdAt:e.createdAt,thanks:e.thanks??[],canThank:e.userId!==viewer.id})),completedCount:user.completedCount,restoreEpoch:h.restoreEpoch??'',revision,syncedAt:now.toISOString()};
}
export async function digest(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function randomToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');}

export function canManageChild(h:Household,actor:Member,childId:string){return actor.kind!=='child'&&(actor.role==='admin'||h.members.some(m=>m.id===childId&&m.kind==='child'&&m.guardianId===actor.id&&!m.removedAt));}
export function canUndo(h:Household,actor:Member,e:HistoryEvent){return e.kind==='completion'&&!!e.taskId&&!e.reversed&&(actor.role==='admin'||canManageChild(h,actor,e.userId)||(actor.id===e.userId&&!(actor.kind==='child'&&e.approvalRequired)));}

/** Reopen only the corrected round; a newer round may already have progress. */
export function reopenTask(t:Task,now:Date,createdAt:string){
 t.revision=(t.revision??0)+1;delete t.handover;
 if(!t.completion)return;
 if(t.checklist?.occurrenceKey===t.completion.occurrenceKey)t.checklist=null;
 if(plan(t,localDay(now),localDay(new Date(createdAt))).occurrenceKey===t.completion.occurrenceKey)t.checklistVersion=(t.checklistVersion??0)+1;
 if(t.cadence==='after')t.reopenedDue=t.completion.occurrenceKey;
 t.completion=null;
}
