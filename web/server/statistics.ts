import {AppError,profile} from './domain.ts';
import type {Household,Member} from './domain.ts';
import {defaultPersonalGoal} from './career.ts';
import type {Repository} from './repository.ts';
import {evidenceCategory,CATEGORY_IDS} from '../shared/categories.ts';
import {addDays,localDay,monday} from '../shared/planning.ts';
import type {Statistics,StatisticBucket,StatisticCategory,StatisticPoint,StatisticRange} from '../shared/statistics.ts';

export function statisticsWindow(now:Date,days:StatisticRange){const to=localDay(now),from=addDays(to,1-days),goalFrom=addDays(monday(to),-35);return {from,to,goalFrom,queryFrom:addDays(from<goalFrom?from:goalFrom,-1)+'T00:00:00.000Z'};}
/** Mission earnings are reconstructed from unreversed completions, never the spendable balance. */
export function summarizeStatistics(rows:StatisticBucket[],h:Household,m:Member,revision:number,days:StatisticRange,now:Date):Statistics{
 const {from,to,goalFrom}=statisticsWindow(now,days),unit=days===7?'day':days===30?'week':'month';
 const dayValues=new Map<string,{count:number;xp:number;stars:number}>(),weekCounts=new Map<string,number>(),categories=new Map<StatisticCategory,number>(),dateCache=new Map<string,string>();
 for(const r of rows){
  let day=dateCache.get(r.at);if(!day){day=localDay(new Date(r.at));dateCache.set(r.at,day);}if(day>to)continue;
  const week=monday(day);if(week>=goalFrom)weekCounts.set(week,(weekCounts.get(week)??0)+r.count);
  if(day<from)continue;
  const v=dayValues.get(day)??{count:0,xp:0,stars:0};v.count+=r.count;v.xp+=r.xp;v.stars+=r.stars;dayValues.set(day,v);
  const category=evidenceCategory({category:r.category??undefined,icon:r.icon??undefined,room:r.room??undefined,title:r.title??undefined})??'unknown';categories.set(category,(categories.get(category)??0)+r.count);
 }
 const totals={count:0,xp:0,stars:0,activeDays:0},groups=new Map<string,StatisticPoint>();
 for(let day=from;day<=to;day=addDays(day,1)){
  const key=unit==='day'?day:unit==='week'?monday(day):day.slice(0,7),v=dayValues.get(day)??{count:0,xp:0,stars:0};
  const point=groups.get(key)??{from:day,to:day,count:0,xp:0,stars:0};point.to=day;point.count+=v.count;point.xp+=v.xp;point.stars+=v.stars;groups.set(key,point);
  totals.count+=v.count;totals.xp+=v.xp;totals.stars+=v.stars;if(v.count)totals.activeDays++;
 }
 const goals=Array.from({length:6},(_,i)=>{
  const key=addDays(goalFrom,i*7),saved=m.career?.weeks[key],current=key===monday(to);
  return {from:key,to:addDays(key,6),count:current?(h.weekKey===key?m.weekCount:0):saved?.count??weekCounts.get(key)??0,goal:current?defaultPersonalGoal(m):saved?.goal??null,current};
 });
 return {householdId:h.id,profileId:m.id,restoreEpoch:h.restoreEpoch??'',revision,generatedAt:now.toISOString(),period:{days,from,to},totals,activity:{unit,points:[...groups.values()]},categories:[...CATEGORY_IDS,'unknown' as const].map(id=>({id,count:categories.get(id)??0})).filter(c=>c.count>0),goals};
}
export async function statisticsView(repo:Repository,accountId:string,profileId:string|null,householdId:string,memberId:string,days:StatisticRange,now:Date){
 const {row,rows}=await repo.statisticsSnapshot(accountId,householdId,memberId,statisticsWindow(now,days).queryFrom,now.toISOString());
 if(!row)throw new AppError(404,'Deine Crew-Mitgliedschaft hat sich geändert.');
 const h=JSON.parse(row.document) as Household,m=profile(h,accountId,profileId);
 if(h.id!==householdId||m.id!==memberId)throw new AppError(409,'Dein Profil hat sich geändert. Bitte lade die Statistik neu.');
 return summarizeStatistics(rows,h,m,row.revision,days,now);
}
