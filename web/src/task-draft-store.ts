import {parseTaskDraft} from '../shared/task-draft.ts';
import type {SavedTaskDraft,TaskFormSnapshot} from '../shared/task-draft.ts';
const PREFIX='putzonaut.form.v1:';const memory=new Map<string,SavedTaskDraft>();
export const taskDraftKey=(scope:string,id?:string)=>PREFIX+JSON.stringify([scope,id??'new']);
export function readTaskDraft(scope:string,id?:string){const key=taskDraftKey(scope,id);try{const raw=localStorage.getItem(key);if(raw){const parsed=raw.length<=30000?parseTaskDraft(JSON.parse(raw)):null;if(!parsed){localStorage.removeItem(key);memory.delete(key);}return parsed;}}catch{}return parseTaskDraft(memory.get(key));}
export function saveTaskDraft(scope:string,id:string|undefined,revision:number|null,snapshot:TaskFormSnapshot){const value:SavedTaskDraft={version:1,updatedAt:Date.now(),revision,snapshot};if(!parseTaskDraft(value))return;const key=taskDraftKey(scope,id);memory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Keep the draft for this open app when storage is unavailable. */}}
export function clearTaskDraft(scope:string,id?:string){const key=taskDraftKey(scope,id);memory.delete(key);try{localStorage.removeItem(key);}catch{}}
export function clearTaskDrafts(){memory.clear();try{for(const key of Object.keys(localStorage))if(key.startsWith(PREFIX))localStorage.removeItem(key);}catch{}}
