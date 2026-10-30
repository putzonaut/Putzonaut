import {z} from 'zod';
import {admin,AppError} from './domain.ts';
import type {Household,Member,HistoryEvent} from './domain.ts';
import {ACHIEVEMENTS} from '../shared/game.ts';
import {weekKey} from '../shared/planning.ts';
import {ensureProgress,freshQuest,questEligible} from './progress.ts';
export function gameChange(route:string,method:string,body:unknown,h:Household,user:Member,now:Date):{result:unknown;event?:HistoryEvent}|null{
 if(route==='/profile/achievement'&&method==='PATCH'){
  const v=z.object({achievementId:z.string().nullable()}).parse(body);
  const selected=ACHIEVEMENTS.find(a=>a.id===v.achievementId);
  if(v.achievementId&&(!selected||(selected.metric==='team'&&h.kind==='solo')))throw new AppError(400,'Wähle einen passenden Meilenstein.');
  if(v.achievementId&&user.achievements?.includes(v.achievementId))throw new AppError(409,'Diesen Meilenstein hast du bereits erreicht.');
  user.focusAchievementId=v.achievementId;return {result:{ok:true}};
 }
 if(route==='/profile/goal'&&method==='PATCH'){
  const v=z.object({rewardId:z.string().uuid().nullable()}).parse(body);if(v.rewardId&&!h.rewards.some(r=>r.id===v.rewardId))throw new AppError(404,'Diesen Wunsch gibt es in deiner Crew nicht.');user.savingRewardId=v.rewardId;return {result:{ok:true}};
 }
 if(route==='/profile/game'&&method==='PATCH'){
  const v=z.object({personalGoal:z.number().int().min(1).max(30),titleId:z.string().nullable(),patchId:z.string().nullable()}).parse(body);
  if(v.titleId&&!ACHIEVEMENTS.some(a=>a.id===v.titleId&&a.title&&user.achievements?.includes(a.id)))throw new AppError(403,'Diesen Titel hast du noch nicht freigeschaltet.');
  if(v.patchId&&!ACHIEVEMENTS.some(a=>a.id===v.patchId&&a.patch&&user.achievements?.includes(a.id)))throw new AppError(403,'Dieses Abzeichen hast du noch nicht freigeschaltet.');
  Object.assign(user,v);return {result:{ok:true}};
 }
 if(route==='/quests'&&method==='POST'){
  admin(user);const v=z.object({weekKey:z.string(),title:z.string().trim().min(2).max(60),taskIds:z.array(z.string().uuid()).min(1).max(5),repeat:z.boolean().default(true)}).parse(body);
  if(v.weekKey!==weekKey(now))throw new AppError(409,'Eine neue Woche hat begonnen. Bitte lade die Seite neu.');if(new Set(v.taskIds).size!==v.taskIds.length)throw new AppError(400,'Wähle verschiedene Aufgaben.');
  const week=ensureProgress(h,now);if(week.quest?.everRewarded)throw new AppError(409,'Diese Wochenquest hatte bereits einen Bonus. Eine neue Quest ist nächste Woche möglich.');
  const allowed=questEligible(h,week.key).map(t=>t.id);if(v.taskIds.some(id=>!allowed.includes(id)))throw new AppError(400,'Wähle Aufgaben, die diese Woche möglich sind. Pausierte oder spätere Aufgaben können nicht Teil der Quest sein.');
  const tasks=v.taskIds.map(id=>{const t=h.tasks.find(t=>t.id===id);if(!t)throw new AppError(404,'Eine gewählte Aufgabe gibt es nicht mehr.');return {id:t.id,title:t.title};});
  week.quest=freshQuest(v.title,tasks);h.game!.questTemplate=v.repeat?{title:v.title,taskIds:v.taskIds}:null;
  return {result:{ok:true},event:{id:crypto.randomUUID(),kind:'quest',title:`Wochenquest: ${v.title}`,userId:user.id,name:user.name,createdAt:now.toISOString()}};
 }
 if(route==='/quests/repeat'&&method==='PATCH'){admin(user);const v=z.object({enabled:z.boolean()}).parse(body);const week=ensureProgress(h,now);if(v.enabled&&!week.quest)throw new AppError(400,'Starte zuerst eine Wochenquest.');h.game!.questTemplate=v.enabled?{title:week.quest!.title,taskIds:week.quest!.tasks.map(t=>t.id)}:null;return {result:{ok:true}};}
 return null;
}
