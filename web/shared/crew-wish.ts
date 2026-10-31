import type {RewardIconId} from './reward-icons.ts';
export type StarChange={userId:string;name:string;stars:number};
export type CrewWish={id:string;title:string;cost:number;icon:RewardIconId;contributions:Record<string,number>};
export function wishTotal(w:CrewWish){return Object.values(w.contributions).reduce((a,b)=>a+b,0);}
