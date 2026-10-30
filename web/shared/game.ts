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
export const STATION_MODULES=[{id:'garden',title:'Pflanzenecke',description:'Ein Stück Grün zwischen den Sternen.',wins:1},{id:'robot',title:'Roboterhelfer',description:'Euer kleiner Begleiter zieht ein.',wins:2},{id:'observatory',title:'Aussichtskuppel',description:'Platz für große gemeinsame Pläne.',wins:3},{id:'workshop',title:'Werkstatt',description:'Hier werden aus Ideen kleine Alltagshelfer.',wins:5},{id:'solar',title:'Solardeck',description:'Frische Energie für eure nächsten Abenteuer.',wins:8},{id:'dock',title:'Andockbucht',description:'Euer Zuhause ist bereit für die große Reise.',wins:12}];
export const ACHIEVEMENTS=[
 {id:'first',name:'Erster Einsatz',description:'Eine bestätigte Mission.',target:1,metric:'total',title:null,patch:null,outfit:null},
 {id:'steady',name:'Dranbleiber',description:'Zehn bestätigte Missionen.',target:10,metric:'total',title:'Sternensammler',patch:'star',outfit:null},
 {id:'team',name:'Teamgeist',description:'Mindestens zwei aktive Crewmitglieder.',target:2,metric:'team',title:null,patch:null,outfit:null},
 {id:'kitchen',name:'Krümelkommandant',description:'Zehn Küchenmissionen seit Version 0.5.',target:10,metric:'kitchen',title:'Krümelkommandant',patch:'comet',outfit:null},
 {id:'garden',name:'Gartenpilot',description:'Fünf Pflanzenmissionen seit Version 0.5.',target:5,metric:'plants',title:'Gartenpilot',patch:'leaf',outfit:'garden'},
 {id:'nebula',name:'Nebelläufer',description:'25 bestätigte Missionen.',target:25,metric:'total',title:'Nebelläufer',patch:'orbit',outfit:'nebula'},
 {id:'dust',name:'Staubbezwinger',description:'50 bestätigte Missionen.',target:50,metric:'total',title:'Staubbezwinger',patch:'dust',outfit:null},
 {id:'hero',name:'Haushaltsheld',description:'100 bestätigte Missionen.',target:100,metric:'total',title:'Haushaltsheld',patch:'crown',outfit:'captain'},
 {id:'wash',name:'Waschonaut',description:'Zehn bestätigte Wäschemissionen.',target:10,metric:'laundry',title:'Waschonaut',patch:'wash',outfit:'wash'},
 {id:'shine',name:'Glanzpilot',description:'Zehn bestätigte Badezimmermissionen.',target:10,metric:'bath',title:'Glanzpilot',patch:'shine',outfit:'shine'},
 {id:'allround',name:'Allroundonaut',description:'Bestätigte Missionen aus fünf Kategorien.',target:5,metric:'variety',title:'Allroundonaut',patch:'compass',outfit:'allround'},
 {id:'rhythm',name:'Im Rhythmus',description:'Dein Wochenziel in vier Wochen erreichen. Pausen sind erlaubt.',target:4,metric:'weeks',title:'Stern im Alltag',patch:'polar',outfit:'polar'},
] as const;
export const GAME_OUTFITS=[{id:'starter',title:'Starter',cost:0,level:1,achievement:null},{id:'comet',title:'Komet',cost:300,level:1,achievement:null},{id:'sun',title:'Sonnenheld',cost:0,level:8,achievement:null},{id:'garden',title:'Gartenpilot',cost:0,level:1,achievement:'garden'},{id:'nebula',title:'Nebelläufer',cost:0,level:1,achievement:'nebula'},{id:'wash',title:'Waschonaut',cost:0,level:1,achievement:'wash'},{id:'shine',title:'Glanzpilot',cost:0,level:1,achievement:'shine'},{id:'allround',title:'Allroundonaut',cost:0,level:1,achievement:'allround'},{id:'polar',title:'Polarstern',cost:0,level:1,achievement:'rhythm'},{id:'captain',title:'Galaxiekapitän',cost:0,level:1,achievement:'hero'}];
export type AchievementId=typeof ACHIEVEMENTS[number]['id'];
export type AchievementProgress=typeof ACHIEVEMENTS[number]&{value:number;unlocked:boolean;applicable?:boolean};
export function nextAchievements<T extends {id:string;value:number;target:number;unlocked:boolean;applicable?:boolean}>(items:T[],focus?:string|null){
 return items.filter(a=>!a.unlocked&&a.applicable!==false).sort((a,b)=>Number(b.id===focus)-Number(a.id===focus)||(b.value/b.target)-(a.value/a.target)||a.target-b.target);
}
export function achievementHint(a:AchievementProgress){
 const left=Math.max(0,a.target-a.value),unit=a.metric==='weeks'?(left===1?'erreichte Zielwoche':'erreichte Zielwochen'):a.metric==='variety'?(left===1?'weitere Kategorie':'weitere Kategorien'):a.metric==='laundry'?(left===1?'Wäschemission':'Wäschemissionen'):a.metric==='bath'?(left===1?'Badezimmermission':'Badezimmermissionen'):a.metric==='kitchen'?(left===1?'Küchenmission':'Küchenmissionen'):a.metric==='plants'?(left===1?'Pflanzenmission':'Pflanzenmissionen'):a.metric==='team'?(left===1?'Crewmitglied':'Crewmitglieder'):(left===1?'Mission':'Missionen');
 const reward=GAME_OUTFITS.find(o=>o.id===a.outfit)?.title??a.name;
 return `Noch ${left} ${unit} bis ${reward}.`;
}
export const REWARD_IDEAS:Record<HouseholdKind,{title:string;cost:number;icon:'film'|'ice'|'meal'|'gift'}[]>={
 family:[{title:'Wunschessen',cost:100,icon:'meal'},{title:'Filmabend aussuchen',cost:150,icon:'film'},{title:'Eis-Ausflug',cost:120,icon:'ice'},{title:'Gemeinsamer Spieletag',cost:250,icon:'gift'}],
 couple:[{title:'Date-Abend planen lassen',cost:250,icon:'gift'},{title:'Lieblingsessen',cost:120,icon:'meal'},{title:'Film auswählen',cost:100,icon:'film'},{title:'Frühstück im Bett',cost:180,icon:'meal'}],
 shared:[{title:'WG-Filmabend auswählen',cost:150,icon:'film'},{title:'Gemeinsam Pizza machen',cost:180,icon:'meal'},{title:'WG-Spieleabend',cost:200,icon:'gift'},{title:'Eisrunde vereinbaren',cost:150,icon:'ice'}],
 solo:[{title:'Zeit für meinen Lieblingsfilm',cost:120,icon:'film'},{title:'Mein Lieblingsessen',cost:100,icon:'meal'},{title:'Ein Ausflug für mich',cost:250,icon:'gift'},{title:'Eine Kugel Lieblingseis',cost:80,icon:'ice'}],
};
