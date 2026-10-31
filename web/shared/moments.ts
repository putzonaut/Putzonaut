import type {State} from '../src/types.ts';
import type {CompletionReceipt} from './experience.ts';
import type {Statistics,StatisticPoint} from './statistics.ts';
import {localDay} from './planning.ts';

export const momentScope=(s:State)=>JSON.stringify([s.viewer.id,s.household.id,s.user.id,s.restoreEpoch]);
export function sameMomentScope(before:State,after:State|null|undefined):after is State{
 return !!after&&momentScope(before)===momentScope(after);
}
/** Animate only the exact balance change explained by this confirmed receipt. */
export function confirmedReward(before:State,after:State|null|undefined,receipt:Pick<CompletionReceipt,'id'|'stars'|'xp'|'pending'|'replayed'|'bonusChanges'>){
 if(!sameMomentScope(before,after)||receipt.pending||receipt.replayed||after.revision<before.revision)return null;
 const bonus=(receipt.bonusChanges??[]).filter(b=>b.userId===before.user.id).reduce((n,b)=>n+b.stars,0);
 const from=before.user.stars,to=after.user.stars,earned=receipt.stars+bonus;
 if(![from,to,earned,receipt.xp].every(Number.isSafeInteger)||earned<0||receipt.xp<0||to-from!==earned)return null;
 return {id:receipt.id,scope:momentScope(after),from,to};
}
export function newStationModules(before:State,after:State|null|undefined){
 return sameMomentScope(before,after)?after.game.station.modules.filter(m=>m.unlocked&&before.game.station.modules.some(old=>old.id===m.id&&!old.unlocked)).map(m=>m.id):[];
}
/** Includes free work and shared missions still awaiting the other part/approval. */
export function dayIsClear(state:State,online:boolean,queued:number){
 return online&&!queued&&!state.life.paused
  &&!state.pendingCompletions.some(p=>p.userId===state.user.id)
  &&!state.tasks.some(t=>['today','overdue','pending'].includes(t.status)
   &&(t.team?t.team.shares.some(s=>s.userId===state.user.id):!t.effectiveAssignedTo||t.effectiveAssignedTo===state.user.id));
}
export function dailyFinish(state:State,stats:Statistics|null,online:boolean,queued:number):StatisticPoint|null{
 if(!stats||!dayIsClear(state,online,queued)||stats.profileId!==state.user.id||stats.householdId!==state.household.id||stats.restoreEpoch!==state.restoreEpoch||stats.revision!==state.revision)return null;
 const day=localDay(new Date(state.syncedAt));
 if(stats.period.to!==day||localDay(new Date(stats.generatedAt))!==day||stats.activity.unit!=='day')return null;
 const point=stats.activity.points.find(p=>p.from===day&&p.to===day);
 return point&&point.count>0&&[point.count,point.xp,point.stars].every(n=>Number.isSafeInteger(n)&&n>=0)?point:null;
}
