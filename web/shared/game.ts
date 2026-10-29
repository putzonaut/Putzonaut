import type {HouseholdKind} from './setup.ts';
export type Difficulty='easy'|'normal'|'hard';
export const DIFFICULTIES=[{id:'easy',label:'Leicht',factor:.75},{id:'normal',label:'Normal',factor:1},{id:'hard',label:'Aufwendig',factor:1.5}] as const;
export function suggestedPoints(minutes:number,difficulty:Difficulty='normal'){
 const duration=Math.max(1,Math.min(180,Number.isFinite(minutes)?minutes:10));const factor=DIFFICULTIES.find(d=>d.id===difficulty)?.factor??1;
 const xp=Math.max(5,Math.min(1000,Math.round(duration*4*factor/5)*5));return {xp,stars:Math.max(5,Math.min(500,Math.round(xp/15)*5))};
}
export const QUEST_BONUS=20;
export type QuestTask={id:string;title:string};
export type Quest={title:string;tasks:QuestTask[];doneIds:string[];contributors:string[];everRewarded:boolean;credits:Record<string,boolean>};
export type GameWeek={key:string;goal:number;count:number;quest:Quest|null};
export type GameProgress={since:string;weeks:Record<string,GameWeek>;questTemplate:{title:string;taskIds:string[]}|null};
export const STATION_MODULES=[{id:'garden',title:'Pflanzenecke',description:'Ein Stück Grün zwischen den Sternen.',wins:1},{id:'robot',title:'Roboterhelfer',description:'Euer kleiner Begleiter zieht ein.',wins:2},{id:'observatory',title:'Aussichtskuppel',description:'Platz für große gemeinsame Pläne.',wins:3}];
export const ACHIEVEMENTS=[
 {id:'first',name:'Erster Einsatz',description:'Eine bestätigte Mission.',target:1,metric:'total',title:null,patch:null,outfit:null},
 {id:'steady',name:'Dranbleiber',description:'Zehn bestätigte Missionen.',target:10,metric:'total',title:'Sternensammler',patch:'star',outfit:null},
 {id:'team',name:'Teamgeist',description:'Mindestens zwei aktive Crewmitglieder.',target:2,metric:'team',title:null,patch:null,outfit:null},
 {id:'kitchen',name:'Krümelkommandant',description:'Zehn Küchenmissionen seit Version 0.5.',target:10,metric:'kitchen',title:'Krümelkommandant',patch:'comet',outfit:null},
 {id:'garden',name:'Gartenpilot',description:'Fünf Pflanzenmissionen seit Version 0.5.',target:5,metric:'plants',title:'Gartenpilot',patch:'leaf',outfit:'garden'},
 {id:'nebula',name:'Nebelläufer',description:'25 bestätigte Missionen.',target:25,metric:'total',title:'Nebelläufer',patch:'orbit',outfit:'nebula'},
] as const;
export const GAME_OUTFITS=[{id:'starter',title:'Starter',cost:0,level:1,achievement:null},{id:'comet',title:'Komet',cost:300,level:1,achievement:null},{id:'sun',title:'Sonnenheld',cost:0,level:8,achievement:null},{id:'garden',title:'Gartenpilot',cost:0,level:1,achievement:'garden'},{id:'nebula',title:'Nebelläufer',cost:0,level:1,achievement:'nebula'}];
export const REWARD_IDEAS:Record<HouseholdKind,{title:string;cost:number;icon:'film'|'ice'|'meal'|'gift'}[]>={
 family:[{title:'Wunschessen',cost:100,icon:'meal'},{title:'Filmabend aussuchen',cost:150,icon:'film'},{title:'Eis-Ausflug',cost:120,icon:'ice'},{title:'Gemeinsamer Spieletag',cost:250,icon:'gift'}],
 couple:[{title:'Date-Abend planen lassen',cost:250,icon:'gift'},{title:'Lieblingsessen',cost:120,icon:'meal'},{title:'Film auswählen',cost:100,icon:'film'},{title:'Frühstück im Bett',cost:180,icon:'meal'}],
 shared:[{title:'WG-Filmabend auswählen',cost:150,icon:'film'},{title:'Gemeinsam Pizza machen',cost:180,icon:'meal'},{title:'WG-Spieleabend',cost:200,icon:'gift'},{title:'Eisrunde vereinbaren',cost:150,icon:'ice'}],
 solo:[{title:'Zeit für meinen Lieblingsfilm',cost:120,icon:'film'},{title:'Mein Lieblingsessen',cost:100,icon:'meal'},{title:'Ein Ausflug für mich',cost:250,icon:'gift'},{title:'Eine Kugel Lieblingseis',cost:80,icon:'ice'}],
};
