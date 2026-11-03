import {CADENCES} from './planning.ts';
import type {Difficulty} from './game.ts';
export const DRAFT_FIELDS=['sentence','sentenceOpen','title','areaId','intervalWeeks','intervalDays','monthDay','intervalMonths','monthWeek','monthWeekday','seasonEnabled','activeMonths','dueDate','startDate','assignedTo','icon','category','knowledge','approvalForChildren'] as const;
export type TaskFormSnapshot={fields:Partial<Record<typeof DRAFT_FIELDS[number],string>>;steps:{id?:string;title:string}[];cadence:string;rotating:boolean;rotation:string[];rotationMode:'weekly'|'balanced';minutes:string;xp:string;stars:string;difficulty:Difficulty;autoPoints:boolean;days:number[];detailsOpen:boolean};
export type SavedTaskDraft={version:1;updatedAt:number;revision:number|null;snapshot:TaskFormSnapshot};
export const DRAFT_TTL=7*24*60*60*1000;
export function parseTaskDraft(value:unknown,now=Date.now()):SavedTaskDraft|null{
 if(!value||typeof value!=='object')return null;const v=value as SavedTaskDraft,s=v.snapshot;
 if(v.version!==1||!Number.isFinite(v.updatedAt)||v.updatedAt>now+60000||now-v.updatedAt>DRAFT_TTL||v.revision!==null&&(!Number.isSafeInteger(v.revision)||v.revision<0)||!s||typeof s!=='object')return null;
 if(!s.fields||typeof s.fields!=='object'||Array.isArray(s.fields)||Object.keys(s.fields).some(k=>!DRAFT_FIELDS.includes(k as typeof DRAFT_FIELDS[number]))||Object.values(s.fields).some(f=>typeof f!=='string'||f.length>1200))return null;
 if(!Array.isArray(s.steps)||s.steps.length>12||s.steps.some(f=>!f||typeof f.title!=='string'||f.title.length>80||f.id!==undefined&&(typeof f.id!=='string'||f.id.length>100)))return null;
 if(!(CADENCES as readonly string[]).includes(s.cadence)||!['weekly','balanced'].includes(s.rotationMode)||!['easy','normal','hard'].includes(s.difficulty))return null;
 if(!Array.isArray(s.rotation)||s.rotation.length>100||s.rotation.some(id=>typeof id!=='string'||id.length>100)||!Array.isArray(s.days)||s.days.length>7||s.days.some(d=>!Number.isInteger(d)||d<1||d>7))return null;
 if([s.minutes,s.xp,s.stars].some(n=>typeof n!=='string'||n.length>30)||[s.rotating,s.autoPoints,s.detailsOpen].some(b=>typeof b!=='boolean'))return null;
 return v;
}
