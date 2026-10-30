import type {Household,Member,HistoryEvent} from './domain.ts';
import type {TemplateCategory} from '../shared/setup.ts';
import type {Repository} from './repository.ts';
import {weekKey} from '../shared/planning.ts';
import {evidenceCategory} from '../shared/categories.ts';

export type Career={version:1;since:string;categories:Partial<Record<TemplateCategory,number>>;weeks:Record<string,{count:number;goal:number}>};
export function defaultPersonalGoal(m:Member){return m.personalGoal??(m.kind==='child'?2:3);}
export function ensureCareer(h:Household,now:Date){
 const key=weekKey(now);
 for(const m of h.members){
  m.career??={version:1,since:now.toISOString(),categories:{},weeks:{}};
  const count=h.weekKey===key?m.weekCount:0;
  m.career.weeks[key]={count,goal:defaultPersonalGoal(m)};
 }
}
/** One guarded migration per member. Older weekly goals were not recorded. */
export async function hydrateCareer(h:Household,repo:Repository,now:Date){
 const missing=new Set(h.members.filter(m=>!m.career).map(m=>m.id));
 if(missing.size){
  const rows=await repo.categoryEvidence(h.id);
  ensureCareer(h,now);
  for(const row of rows){
   if(!missing.has(row.memberId))continue;
   const category=evidenceCategory(row),m=h.members.find(m=>m.id===row.memberId);
   if(category&&m)m.career!.categories[category]=(m.career!.categories[category]??0)+row.count;
  }
 }
 ensureCareer(h,now);
}
export function updateCareer(h:Household,event:HistoryEvent,now:Date){
 const m=h.members.find(m=>m.id===event.userId);if(!m?.career)return;
 const category=evidenceCategory(event);
 if(event.kind==='completion'){
  if(category)m.career.categories[category]=(m.career.categories[category]??0)+1;
 }else if(event.kind==='correction'){
  if(category)m.career.categories[category]=Math.max(0,(m.career.categories[category]??0)-1);
  const key=event.originalCreatedAt?weekKey(new Date(event.originalCreatedAt)):weekKey(now);
  const week=m.career.weeks[key];
  if(week&&key!==weekKey(now))week.count=Math.max(0,week.count-1);
 }
}
