import {roomOrder} from './room-order.ts';
import {availableMissions} from './quick-start.ts';
import type {Task,User} from '../src/types.ts';
import type {Pause} from './planning.ts';
export type RoundMode='normal'|'gentle'|'visitors';
export type TeamShare={userId:string;name:string;xp:number;stars:number;confirmed:boolean;approved:boolean;needsApproval:boolean};
export type TeamMission={id:string;occurrenceKey:string;createdBy:string;shares:TeamShare[]};
export const awayOn=(away:Pause|null|undefined,day:string)=>!!away&&away.from<=day&&(!away.until||away.until>=day);
export const effort=(task:{minutes:number;difficulty?:string})=>Math.round(task.minutes*(task.difficulty==='hard'?1.5:task.difficulty==='easy'?0.75:1));
export function visitorPriority(t:Pick<Task,'title'|'room'|'category'>){
 const text=t.title+' '+t.room;
 if(/eingang|flur|schuhe|jacken|garderobe/i.test(text))return 0;
 if(/gäste.?wc|toilette|waschbecken|handtücher|badeimer/i.test(text))return 1;
 if(/sofa|kissen|wohn|esstisch|spielzeug/i.test(text))return 2;
 return 9;
}
export function lifeMissions(tasks:Task[],user:Pick<User,'id'>,minutes:number,mode:RoundMode){
 let choices=availableMissions(tasks,user).filter(t=>!t.team);
 if(mode==='gentle')choices=choices.filter(t=>t.minutes<=5&&t.difficulty!=='hard').sort((a,b)=>Number(b.overdue)-Number(a.overdue)||a.minutes-b.minutes||a.id.localeCompare(b.id));
 if(mode==='visitors')choices=choices.filter(t=>visitorPriority(t)<9).sort((a,b)=>visitorPriority(a)-visitorPriority(b)||a.minutes-b.minutes||a.id.localeCompare(b.id));
 const selected:Task[]=[];let remaining=mode==='gentle'?Math.min(minutes,10):minutes;
 for(const t of choices){if(t.minutes<=remaining){selected.push(t);remaining-=t.minutes;}if(selected.length===3)break;}
 return roomOrder(selected);
}
export const DECORATIONS=[
 {id:'plant',slot:'plant',name:'Sternenpflanze',requirement:'Von Anfang an dabei',achievement:null},
 {id:'moonflower',slot:'plant',name:'Mondblume',requirement:'10 bestätigte Missionen in eurer Crew',achievement:null},
 {id:'sofa',slot:'furniture',name:'Feierabend-Sofa',requirement:'Von Anfang an dabei',achievement:null},
 {id:'books',slot:'furniture',name:'Bücherinsel',requirement:'25 bestätigte Missionen in eurer Crew',achievement:null},
 {id:'orbit',slot:'window',name:'Blick auf die Erde',requirement:'Von Anfang an dabei',achievement:null},
 {id:'aurora',slot:'window',name:'Polarlicht',requirement:'Eine erreichte Crew-Zielwoche',achievement:null},
 {id:'robot',slot:'companion',name:'Robi, der Helfer',requirement:'50 bestätigte Missionen in eurer Crew',achievement:null},
 {id:'golden-broom',slot:'companion',name:'Goldene Kehrmaschine',requirement:'Kehrminator-Abzeichen in eurer Crew',achievement:'kehrminator'},
] as const;
export type DecorSlot=typeof DECORATIONS[number]['slot'];
export type StationStyle=Partial<Record<DecorSlot,string>>;
export const DEFAULT_STYLE:StationStyle={plant:'plant',furniture:'sofa',window:'orbit'};
export function decorUnlocked(id:string,total:number,wins:number,achievements:string[]){
 return ['plant','sofa','orbit'].includes(id)||id==='moonflower'&&total>=10||id==='books'&&total>=25||id==='aurora'&&wins>=1||id==='robot'&&total>=50||id==='golden-broom'&&achievements.includes('kehrminator');
}
export function decorationView(h:{stationStyle?:StationStyle;members:{completedCount:number;achievements?:string[]}[];game?:{weeks:Record<string,{count:number;goal:number}>}}){
 const total=h.members.reduce((n,m)=>n+m.completedCount,0),wins=Object.values(h.game?.weeks??{}).filter(w=>w.count>=w.goal).length,achievements=h.members.flatMap(m=>m.achievements??[]);
 const items=DECORATIONS.map(d=>({...d,unlocked:decorUnlocked(d.id,total,wins,achievements)}));
 const selected={...DEFAULT_STYLE,...h.stationStyle};for(const slot of Object.keys(selected) as DecorSlot[])if(!items.some(d=>d.id===selected[slot]&&d.unlocked))delete selected[slot];
 return {selected,items};
}
