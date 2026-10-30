import {z} from 'zod';
import {admin,AppError,rewardSchema} from './domain.ts';
import type {Household,Member,HistoryEvent} from './domain.ts';
import type {Repository} from './repository.ts';
import {wishTotal} from '../shared/crew-wish.ts';
import type {StarChange} from '../shared/crew-wish.ts';

export function refundContribution(h:Household,m:Member):StarChange[]{const n=h.crewWish?.contributions[m.id]??0;if(h.crewWish)delete h.crewWish.contributions[m.id];if(!n)return [];m.stars+=n;return [{userId:m.id,name:m.name,stars:n}];}
export async function crewWishChange(route:string,method:string,body:unknown,h:Household,user:Member,viewer:Member,now:Date,repo:Repository){
 if(!/^\/crew-wishes(?:\/[^/]+\/(deposit|withdraw|redeem|cancel))?$/.test(route))return null;
 if(method!=='POST')throw new AppError(405,'Diese Aktion ist hier nicht möglich.');
 const action=route.split('/')[3]??'create',id=route.split('/')[2];
 const v=action==='create'?rewardSchema.extend({requestKey:z.string().uuid()}).parse(body):z.object({requestKey:z.string().uuid(),amount:z.number().int().min(1).max(10000).optional()}).parse(body);
 if(['deposit','withdraw'].includes(action)&&!('amount' in v&&v.amount))throw new AppError(400,'Wähle einen positiven Sternenbetrag.');
 if(['create','redeem','cancel'].includes(action))admin(user);
 const operation=JSON.stringify([route,v]),previous=await repo.existingRequest(user.id,v.requestKey);
 if(previous){if(previous.operation!==operation)throw new AppError(409,'Diese Anfrage wurde bereits für eine andere Buchung verwendet.');return {result:{ok:true,id:previous.redemption?.id??previous.wishId}};}
 const e:HistoryEvent={id:crypto.randomUUID(),kind:'wish-'+action,title:'',userId:user.id,name:user.name,createdAt:now.toISOString(),requestKey:v.requestKey,operation,...(user.id!==viewer.id?{recordedBy:viewer.id,recordedByName:viewer.name}:{})};
 if(action==='create'){
  if(h.crewWish)throw new AppError(409,'Eure Crew spart bereits auf einen Wunsch.');const value=rewardSchema.parse(v);h.crewWish={id:crypto.randomUUID(),...value,contributions:{}};e.title=`Gemeinsamer Wunsch: ${value.title}`;e.wishId=h.crewWish.id;return {result:{id:h.crewWish.id},event:e};
 }
 const wish=h.crewWish;if(!wish||wish.id!==id)throw new AppError(409,'Dieser gemeinsame Wunsch wurde bereits beendet.');
 e.wishId=wish.id;e.title=wish.title;const amount='amount' in v?v.amount??0:0,total=wishTotal(wish),own=wish.contributions[user.id]??0;
 if(action==='deposit'){
  if(user.stars<amount)throw new AppError(409,'Dafür fehlen dir noch Sterne.');if(total+amount>wish.cost)throw new AppError(409,'So viele Sterne fehlen nicht mehr. Bitte lade den Wunsch neu.');user.stars-=amount;wish.contributions[user.id]=own+amount;e.stars=-amount;e.title=`Beitrag: ${wish.title}`;
 }else if(action==='withdraw'){
  if(amount>own)throw new AppError(409,'Du kannst nur deinen eigenen Beitrag zurücknehmen.');user.stars+=amount;wish.contributions[user.id]=own-amount;e.stars=amount;e.title=`Beitrag zurückgenommen: ${wish.title}`;
 }else if(action==='cancel'){
  e.starChanges=h.members.flatMap(m=>refundContribution(h,m));e.title=`Wunsch abgebrochen: ${wish.title}`;h.crewWish=null;
 }else if(action==='redeem'){
  if(total!==wish.cost)throw new AppError(409,'Für euren Wunsch fehlen noch Sterne.');
  const redemption={id:crypto.randomUUID(),user_id:user.id,reward_id:wish.id,request_key:v.requestKey,title:wish.title,cost:wish.cost,user_name:'Eure Crew',created_at:now.toISOString(),fulfilled_at:null,shared:true,contributors:Object.entries(wish.contributions).filter(([,n])=>n>0).map(([id,stars])=>({userId:id,name:h.members.find(m=>m.id===id)!.name,stars}))};
  h.redemptions.unshift(redemption);e.redemption=redemption;e.title=`Gemeinsam eingelöst: ${wish.title}`;h.crewWish=null;
 }
 return {result:{ok:true,id:e.redemption?.id},event:e};
}
