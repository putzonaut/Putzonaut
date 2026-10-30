import {z} from 'zod';
import {CATEGORY_IDS} from '../shared/categories.ts';
import {AREA_ICONS} from '../shared/workspace.ts';
import {validDay} from '../shared/planning.ts';
import {AppError,taskSchema,rewardSchema,digest} from './domain.ts';
import type {Household,HistoryEvent} from './domain.ts';

import {BACKUP_MAX_BYTES,BACKUP_MAX_EVENTS} from '../shared/backup.ts';
export {BACKUP_MAX_BYTES,BACKUP_MAX_EVENTS} from '../shared/backup.ts';
const id=z.string().uuid();
const day=z.string().refine(validDay);
const stamp=z.string().datetime();
const count=z.number().int().min(0).max(1_000_000_000);
const signedCount=z.number().int().min(-1_000_000_000).max(1_000_000_000);
const short=z.string().max(400);
const step=z.object({id,title:z.string().min(1).max(80)}).strict();
const steps=z.array(step).max(12).refine(s=>new Set(s.map(x=>x.id)).size===s.length);
const occurrence=z.string().max(20).refine(s=>s==='once'||validDay(s));
const person=z.object({
 id,kind:z.enum(['account','child']).optional(),guardianId:id.nullable().optional(),removedAt:stamp.nullable().optional(),
 name:z.string().min(1).max(40),role:z.enum(['admin','member']),xp:count,stars:signedCount,outfit:z.string().max(40),
 unlocked:z.array(z.string().max(40)).max(50),completedCount:count,weekCount:count,joinedAt:stamp,
 focusAchievementId:z.string().max(40).nullable().optional(),
 career:z.object({version:z.literal(1),since:stamp,categories:z.object(Object.fromEntries(CATEGORY_IDS.map(id=>[id,count.optional()])) as Record<typeof CATEGORY_IDS[number],z.ZodOptional<typeof count>>).strict(),weeks:z.record(day,z.object({count,goal:z.number().int().min(1).max(30)}).strict())}).strict().optional(),
 savingRewardId:id.nullable().optional(),personalGoal:z.number().int().min(1).max(30).optional(),
 titleId:z.string().max(40).nullable().optional(),patchId:z.string().max(40).nullable().optional(),
 achievements:z.array(z.string().max(40)).max(50).optional(),gameStats:z.object({kitchen:count,plants:count}).strict().optional(),
}).strict();
const redemption=z.object({id,user_id:id,reward_id:id,request_key:id,title:short,cost:count,user_name:short,created_at:stamp,fulfilled_at:stamp.nullable()}).strict();
const event=z.object({
 id,kind:z.string().min(1).max(40),userId:id,name:short,title:short,createdAt:stamp,
 xp:signedCount.optional(),stars:signedCount.optional(),rewardId:id.optional(),
 requestKey:z.string().max(80).refine(s=>z.string().uuid().safeParse(s).success||/^undo:[0-9a-f-]{36}$/.test(s)).optional(),
 redemption:redemption.optional(),recordedBy:id.optional(),recordedByName:short.optional(),taskId:id.optional(),occurrenceKey:occurrence.optional(),
 category:z.enum(CATEGORY_IDS).optional(),approvalRequired:z.boolean().optional(),steps:steps.optional(),room:short.optional(),icon:z.string().max(30).optional(),
 progressTracked:z.boolean().optional(),originalCreatedAt:stamp.optional(),reverses:id.optional(),
 bonusChanges:z.array(z.object({userId:id,name:short,stars:signedCount,week:day}).strict()).max(1000).optional(),
}).strict();
const pending=event.extend({taskId:id,occurrenceKey:occurrence,xp:count,stars:count});
const task=taskSchema.extend({
 id,steps:steps.optional(),checklistVersion:count.optional(),
 checklist:z.object({occurrenceKey:occurrence,doneIds:z.array(id).max(12)}).strict().nullable().optional(),
 createdOn:day.optional(),rotationStart:day.optional(),skipThrough:day.nullable().optional(),
 pause:z.object({from:day,until:day.nullable()}).strict().nullable().optional(),
 completion:z.object({steps:steps.optional(),id:id.optional(),status:z.enum(['pending','approved']).optional(),occurrenceKey:occurrence,userId:id,user_name:short,created_at:stamp,xp:count,stars:count}).strict().nullable(),
}).strict().superRefine((t,ctx)=>{
 const bad=(message:string)=>ctx.addIssue({code:'custom',message});
 if(t.dueDate&&!validDay(t.dueDate)||t.schedule?.startDate&&!validDay(t.schedule.startDate))bad('Ungültiges Datum');
 if(t.cadence==='weekdays'&&!t.schedule?.weekdays?.length)bad('Fehlende Wochentage');
 if(t.cadence==='interval'&&(!t.schedule?.startDate||!t.schedule.intervalWeeks))bad('Fehlender Rhythmus');
 if(t.cadence==='monthly'&&!t.schedule?.monthDay)bad('Fehlender Monatstag');
 if(t.pause?.until&&t.pause.until<t.pause.from)bad('Ungültige Pause');
 if(t.checklist?.doneIds.some(i=>!t.steps?.some(s=>s.id===i)))bad('Unbekannter Teilschritt');
 if(new Set(t.rotationIds??[]).size!==(t.rotationIds??[]).length)bad('Doppelte Zuständigkeit');
});
const quest=z.object({title:short,tasks:z.array(z.object({id,title:short}).strict()).max(5),doneIds:z.array(id).max(5),contributors:z.array(id).max(1000),everRewarded:z.boolean(),credits:z.record(id,z.boolean())}).strict();
const game=z.object({since:stamp,weeks:z.record(day,z.object({key:day,goal:z.number().int().min(1).max(500),count,quest:quest.nullable()}).strict()),questTemplate:z.object({title:short,taskIds:z.array(id).max(5)}).strict().nullable()}).strict();
const crew=z.object({
 schema:z.literal(1),id,name:z.string().min(2).max(60),kind:z.enum(['family','couple','shared','solo']).optional(),
 goalTitle:z.string().min(2).max(80),weekGoal:z.number().int().min(1).max(500),weekKey:day,timezone:z.literal('Europe/Berlin'),createdAt:stamp,
 members:z.array(person).min(1).max(1000),tasks:z.array(task).max(200),rewards:z.array(rewardSchema.extend({id}).strict()).max(100),
 redemptions:z.array(redemption).max(BACKUP_MAX_EVENTS),areas:z.array(z.object({id:z.string().min(1).max(40),name:z.string().min(1).max(40),icon:z.enum(AREA_ICONS),builtIn:z.boolean().optional()}).strict()).max(24).optional(),
 game:game.optional(),pendingCompletions:z.array(pending).max(200).optional(),
}).strict();
const payloadSchema=z.object({crew,history:z.array(event).max(BACKUP_MAX_EVENTS)}).strict();
export type BackupPayload=z.infer<typeof payloadSchema>;
export type CrewBackup={format:'putzonaut-backup';version:1;createdAt:string;sourceRevision:number;payload:BackupPayload;checksum:string};
export function snapshotCrew(h:Household){
 const {restoreEpoch:_epoch,invites:_invites,lastMutation:_mutation,closedAt:_closed,...data}=h;
 return {...data,members:h.members.map(({accountId:_account,...m})=>m)};
}
function checkReferences(data:BackupPayload){
 const h=data.crew,ids=new Set(h.members.map(m=>m.id));
 const unique=(values:string[])=>new Set(values).size===values.length;
 const validMember=(value?:string|null)=>!value||ids.has(value);
 if(!unique(h.members.map(x=>x.id))||!unique(h.tasks.map(x=>x.id))||!unique(h.rewards.map(x=>x.id))||!unique(h.redemptions.map(x=>x.id))||!unique((h.areas??[]).map(x=>x.id))||!unique(data.history.map(x=>x.id)))throw new AppError(400,'Die Sicherung enthält doppelte Einträge.');
 if(!h.members.every(m=>validMember(m.guardianId))||!h.tasks.every(t=>validMember(t.assignedTo)&&(t.rotationIds??[]).every(validMember)&&validMember(t.completion?.userId)))throw new AppError(400,'Die Sicherung enthält unbekannte Profile.');
 if(!h.redemptions.every(r=>validMember(r.user_id))||![...data.history,...(h.pendingCompletions??[])].every(e=>validMember(e.userId)&&validMember(e.recordedBy)&&(e.bonusChanges??[]).every(b=>validMember(b.userId))))throw new AppError(400,'Das Logbuch passt nicht zu dieser Crew.');
 const requests=data.history.filter(e=>e.requestKey).map(e=>e.userId+':'+e.requestKey);
 if(!unique(requests))throw new AppError(400,'Die Sicherung enthält doppelte Buchungen.');
 if(h.game&&Object.entries(h.game.weeks).some(([key,w])=>key!==w.key||w.quest&&[...w.quest.contributors,...Object.keys(w.quest.credits)].some(i=>!ids.has(i))))throw new AppError(400,'Der Wochenfortschritt passt nicht zur Crew.');
}
export async function makeBackup(h:Household,history:HistoryEvent[],revision:number,now:Date):Promise<CrewBackup>{
 // Validate our own output too; unsupported future shapes must never create an
 // apparently successful file which cannot be restored.
 const payload=payloadSchema.parse({crew:snapshotCrew(h),history});checkReferences(payload);
 const data={format:'putzonaut-backup' as const,version:1 as const,createdAt:now.toISOString(),sourceRevision:revision,payload};
 const backup={...data,checksum:await digest(JSON.stringify(data))};
 if(new TextEncoder().encode(JSON.stringify(backup)).length>BACKUP_MAX_BYTES)throw new AppError(413,'Diese Crew-Sicherung ist größer als 8 MB. Bitte nutze eine Sicherung durch den Betreiber.');
 return backup;
}
export async function parseBackup(value:unknown):Promise<CrewBackup>{
 const envelope=z.object({format:z.literal('putzonaut-backup'),version:z.literal(1),createdAt:stamp,sourceRevision:count,payload:z.unknown(),checksum:z.string().regex(/^[a-f0-9]{64}$/)}).strict().safeParse(value);
 if(!envelope.success)throw new AppError(400,'Bitte wähle eine Putzonaut-Sicherung ab Version 0.7. Ältere Crew-Exporte sind nicht wiederherstellbar.');
 const {checksum,...data}=envelope.data;
 if(await digest(JSON.stringify(data))!==checksum)throw new AppError(400,'Die Sicherung ist beschädigt oder wurde verändert. Bitte wähle die ursprüngliche Datei.');
 const parsed=payloadSchema.safeParse(data.payload);
 if(!parsed.success)throw new AppError(400,'Die Sicherung enthält ungültige Daten und wurde nicht übernommen.');
 checkReferences(parsed.data);
 return {...data,payload:parsed.data,checksum};
}
export function checkBackupCrew(backup:CrewBackup,current:Household){
 const h=backup.payload.crew;
 if(h.id!==current.id||h.createdAt!==current.createdAt)throw new AppError(409,'Diese Sicherung gehört zu einer anderen Crew.');
 const roster=(members:typeof h.members)=>JSON.stringify(members.map(m=>[m.id,m.kind??'account',m.role,m.guardianId??null,m.removedAt??null]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
 if(roster(h.members)!==roster(current.members))throw new AppError(409,'Mitglieder, Rollen oder Kinderbegleitungen haben sich seit der Sicherung geändert. Dieser Stand kann nicht sicher eingespielt werden.');
}
