import type {Task,TaskDraft} from './types.ts';
import {localDay} from '../shared/planning.ts';
import {TASK_TEMPLATES} from '../shared/setup.ts';
export function duplicateDraft(task:Task,today=localDay(new Date())):TaskDraft{
 return {title:task.title.slice(0,72)+' (Kopie)',room:task.room,areaId:task.areaId,icon:task.icon,minutes:task.minutes,xp:task.xp,stars:task.stars,difficulty:task.difficulty,cadence:task.cadence,dueDate:task.cadence==='once'?today:null,schedule:{...task.schedule,startDate:today},assignedTo:null,rotationIds:[],approvalForChildren:task.approvalForChildren,steps:(task.steps??[]).map(s=>({title:s.title}))};
}
export function templateDraft(key:string):TaskDraft{
 const t=TASK_TEMPLATES.find(t=>t.key===key);if(!t)throw new Error('Unbekannte Vorlage');
 return {title:t.title,room:t.room,icon:t.icon,minutes:t.minutes,xp:t.xp,stars:t.stars,cadence:t.cadence,steps:(t.steps??[]).map(title=>({title}))};
}
