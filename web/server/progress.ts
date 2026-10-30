import {ensureCareer,updateCareer} from './career.ts';
import type {Household,Member,HistoryEvent} from './domain.ts';
import type {Repository} from './repository.ts';
import {ACHIEVEMENTS,GAME_OUTFITS,QUEST_BONUS,STATION_MODULES} from '../shared/game.ts';
import type {GameWeek,Quest} from '../shared/game.ts';
import {addDays,localDay,plan,weekKey} from '../shared/planning.ts';

export function questEligible(h:Household,key:string){
 const fallback=localDay(new Date(h.createdAt));
 return h.tasks.filter(t=>{
  const completedThisWeek=!!t.completion&&t.completion.status!=='pending'&&weekKey(new Date(t.completion.created_at))===key;
  if(completedThisWeek)return true;
  // A partial-week pause must not hide an otherwise available round. Completed
  // monthly/interval rounds from an older week cannot contribute again.
  for(let day=0;day<7;day++){const p=plan(t,addDays(key,day),fallback);if(p.occurrenceKey&&p.status!=='paused'&&p.status!=='done')return true;}
  return false;
 });
}
export function freshQuest(title:string,tasks:{id:string;title:string}[]):Quest{return {title,tasks:tasks.map(t=>({id:t.id,title:t.title})),doneIds:[],contributors:[],everRewarded:false,credits:{}};}
export function achievementValue(m:Member,metric:string,crewSize:number){
 if(metric==='total')return m.completedCount;if(metric==='team')return crewSize;
 if(metric==='kitchen')return m.gameStats?.kitchen??0;if(metric==='plants')return m.gameStats?.plants??0;
 if(metric==='laundry'||metric==='bath')return m.career?.categories[metric]??0;
 if(metric==='variety')return Object.values(m.career?.categories??{}).filter(n=>n>0).length;
 if(metric==='weeks')return Object.values(m.career?.weeks??{}).filter(w=>w.count>=w.goal).length;return 0;
}
export function grantAchievements(h:Household){const size=h.members.filter(m=>!m.removedAt).length;for(const m of h.members){m.achievements??=[];for(const a of ACHIEVEMENTS){if(!m.achievements.includes(a.id)&&achievementValue(m,a.metric,size)>=a.target)m.achievements.push(a.id);if(a.outfit&&m.achievements.includes(a.id)&&!m.unlocked.includes(a.outfit))m.unlocked.push(a.outfit);}}}
export function ensureProgress(h:Household,now:Date){
 ensureCareer(h,now);
 h.game??={since:now.toISOString(),weeks:{},questTemplate:null};const key=weekKey(now);
 if(!h.game.weeks[key]){const eligible=questEligible(h,key);const template=h.game.questTemplate;const tasks=template?template.taskIds.flatMap(id=>{const t=eligible.find(t=>t.id===id);return t?[t]:[];}):[];h.game.weeks[key]={key,goal:h.weekGoal,count:0,quest:template&&tasks.length?freshQuest(template.title,tasks):null};}
 const week=h.game.weeks[key];week.count=h.members.reduce((n,m)=>n+m.weekCount,0);grantAchievements(h);return week;
}
export function progressView(h:Household,m:Member,now:Date){
 const week=ensureProgress(h,now),wins=Object.values(h.game!.weeks).filter(w=>w.count>=w.goal).length;
 const achievements=ACHIEVEMENTS.map(a=>({...a,applicable:a.metric!=='team'||h.kind!=='solo',value:achievementValue(m,a.metric,h.members.filter(m=>!m.removedAt).length),unlocked:m.achievements!.includes(a.id)}));
 const goal=h.rewards.find(r=>r.id===m.savingRewardId);const available=Math.max(0,m.stars);
 const eligible=questEligible(h,week.key),wanted=h.kind==='solo'?2:h.kind==='shared'?4:3;
 const kitchen=eligible.filter(t=>t.room==='Küche');const candidates=kitchen.length>=2?kitchen:eligible;
 const suggestions=candidates.slice(0,wanted).map(t=>({id:t.id,title:t.title}));
 return {focusAchievementId:m.focusAchievementId??null,station:{wins,stage:STATION_MODULES.filter(module=>wins>=module.wins).length,modules:STATION_MODULES.map(module=>({...module,unlocked:wins>=module.wins})),current:{key:week.key,count:week.count,goal:week.goal},nextWeekGoal:h.weekGoal},quest:week.quest?{...week.quest,weekKey:week.key,bonus:QUEST_BONUS,endsOn:addDays(week.key,6),tasks:week.quest.tasks.map(t=>({...t,done:week.quest!.doneIds.includes(t.id),available:h.tasks.some(x=>x.id===t.id)})),contributors:week.quest.contributors.map(id=>({id,name:h.members.find(m=>m.id===id)?.name??'Ehemaliges Mitglied'}))}:null,questOptions:eligible.map(t=>({id:t.id,title:t.title,room:t.room})),questSuggestion:{title:kitchen.length>=2?'Küche klar!':'Gemeinsam klar Schiff!',tasks:suggestions},questTemplate:h.game!.questTemplate,achievements,personalGoal:{target:m.personalGoal??(m.kind==='child'?2:3),count:m.weekCount,trackedSince:m.career?.since??now.toISOString()},savingGoal:goal?{...goal,saved:Math.min(goal.cost,available),remaining:Math.max(0,goal.cost-m.stars),ready:m.stars>=goal.cost}:null,outfits:GAME_OUTFITS.map(o=>({...o,unlocked:m.unlocked.includes(o.id),requirement:o.achievement?ACHIEVEMENTS.find(a=>a.id===o.achievement)!.description:null}))};
}
async function updateQuest(h:Household,week:GameWeek,e:HistoryEvent,repo:Repository){
 const q=week.quest;if(!q)return;
 const events=await repo.weekCompletions(h.id,week.key);const valid=events.filter(x=>x.id!==e.reverses);
 if(e.kind==='completion'&&weekKey(new Date(e.createdAt))===week.key)valid.push(e);
 const relevant=valid.filter(x=>q.tasks.some(t=>t.id===x.taskId));q.doneIds=[...new Set(relevant.map(x=>x.taskId!))];q.contributors=[...new Set(relevant.map(x=>x.userId))];
 const complete=q.tasks.length>0&&q.tasks.every(t=>q.doneIds.includes(t.id));if(complete)q.everRewarded=true;
 for(const m of h.members){const should=complete&&q.contributors.includes(m.id);const credited=!!q.credits[m.id];if(should===credited)continue;const delta=should?QUEST_BONUS:-QUEST_BONUS;m.stars+=delta;q.credits[m.id]=should;(e.bonusChanges??=[]).push({userId:m.id,name:m.name,stars:delta,week:week.key});}
}
/** Called before the guarded D1 batch: game rewards share the same CAS and transaction. */
export async function updateProgress(h:Household,e:HistoryEvent|undefined,repo:Repository,now:Date){
 const current=ensureProgress(h,now);if(!e)return;updateCareer(h,e,now);
 if(e.kind==='completion'){
  const m=h.members.find(m=>m.id===e.userId)!;m.gameStats??={kitchen:0,plants:0};if(e.room==='Küche')m.gameStats.kitchen++;if(e.icon==='plant')m.gameStats.plants++;e.progressTracked=true;
  await updateQuest(h,current,e,repo);
 }else if(e.kind==='correction'){
  const m=h.members.find(m=>m.id===e.userId)!;if(e.progressTracked){m.gameStats??={kitchen:0,plants:0};if(e.room==='Küche')m.gameStats.kitchen=Math.max(0,m.gameStats.kitchen-1);if(e.icon==='plant')m.gameStats.plants=Math.max(0,m.gameStats.plants-1);}
  const key=e.originalCreatedAt?weekKey(new Date(e.originalCreatedAt)):current.key;const week=h.game!.weeks[key];if(week){if(key!==current.key)week.count=Math.max(0,week.count-1);await updateQuest(h,week,e,repo);}
 }else if(e.kind==='quest')await updateQuest(h,current,e,repo);
 grantAchievements(h);
}
