import type {State} from '../src/types.ts';
import type {CompletionReceipt} from './experience.ts';
import {confirmedReward,sameMomentScope} from './moments.ts';

export type MissionView={area:string;mine:boolean;bucket:string;query:string;mode:string;rooms:boolean};
export const DEFAULT_MISSION_VIEW:MissionView={area:'',mine:false,bucket:'open',query:'',mode:'list',rooms:false};
export function missionView(value:unknown):MissionView{
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
 return {area:typeof v.area==='string'?v.area.slice(0,100):'',mine:v.mine===true,bucket:['open','upcoming','done','paused'].includes(String(v.bucket))?String(v.bucket):'open',query:typeof v.query==='string'?v.query.slice(0,100):'',mode:['list','week','rooms','routines'].includes(String(v.mode))?String(v.mode):'list',rooms:v.rooms===true};
}
export function todayOverview(state:State,queuedTaskIds:ReadonlySet<string>=new Set()){
 if(state.life.paused)return {count:0,minutes:0};
 const tasks=state.tasks.filter(t=>['today','overdue'].includes(t.status)&&!!t.occurrenceKey&&!queuedTaskIds.has(t.id)
  &&(t.team?t.team.shares.some(s=>s.userId===state.user.id&&!s.confirmed):!t.effectiveAssignedTo||t.effectiveAssignedTo===state.user.id));
 return {count:tasks.length,minutes:tasks.reduce((n,t)=>n+t.minutes,0)};
}
export type WishProgress={id:string;title:string;remaining:number};
export function completionWish(before:State,after:State|null|undefined,receipt:Pick<CompletionReceipt,'id'|'stars'|'xp'|'pending'|'replayed'|'bonusChanges'>):WishProgress|null{
 if(receipt.pending||receipt.replayed||!sameMomentScope(before,after)||!confirmedReward(before,after,receipt)||after.user.stars<=before.user.stars)return null;
 const goal=after.game.savingGoal;
 if(!goal||before.game.savingGoal?.id!==goal.id||!after.rewards.some(r=>r.id===goal.id&&r.cost===goal.cost))return null;
 return {id:goal.id,title:goal.title,remaining:Math.max(0,goal.cost-after.user.stars)};
}
export const wishProgressText=(wish:WishProgress)=>wish.remaining>0?`Noch ${wish.remaining} Sterne bis „${wish.title}“.`:`Du hast genug Sterne für „${wish.title}“!`;
export function sheetViewport(layoutHeight:number,visualHeight:number,offsetTop:number,scale:number,editing:boolean){
 if(![layoutHeight,visualHeight,offsetTop,scale].every(Number.isFinite)||layoutHeight<=0||visualHeight<=0)return {inset:0,height:layoutHeight};
 const inset=editing&&Math.abs(scale-1)<.05?Math.max(0,layoutHeight-visualHeight-offsetTop):0;
 return {inset:inset>80?inset:0,height:Math.abs(scale-1)<.05?Math.min(layoutHeight,visualHeight):layoutHeight};
}
