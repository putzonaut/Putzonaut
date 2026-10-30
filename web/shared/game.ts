export {REWARD_IDEAS} from './rewards.ts';
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
export type GameProgress={since:string;weeks:Record<string,GameWeek>;questTemplate:{title:string;taskIds:string[]}|null;legacyStationStage?:number};
export const STATION_MODULES=[{id:'garden',title:'Pflanzenecke',description:'Ein Stück Grün zwischen den Sternen.',wins:1},{id:'robot',title:'Roboterhelfer',description:'Euer kleiner Begleiter zieht ein.',wins:2},{id:'observatory',title:'Aussichtskuppel',description:'Platz für große gemeinsame Pläne.',wins:3},{id:'workshop',title:'Werkstatt',description:'Hier werden aus Ideen kleine Alltagshelfer.',wins:6},{id:'solar',title:'Solardeck',description:'Frische Energie für eure nächsten Abenteuer.',wins:9},{id:'dock',title:'Andockbucht',description:'Euer Zuhause ist bereit für die große Reise.',wins:14}];
/** Only already-earned station modules keep their pre-0.12 targets. Corrections still apply. */
export const LEGACY_STATION_TARGETS=[1,2,3,5,8,12] as const;
export function stationModules(legacyStage=0){return STATION_MODULES.map((module,i)=>({...module,wins:i<legacyStage?LEGACY_STATION_TARGETS[i]:module.wins}));}
export const PRACTISED_CATEGORY_MIN=5;
export const SPECIAL_BADGES=[
 {id:'franz-beckenkehrer',name:'Franz Beckenkehrer',description:'24 bestätigte Missionen in der Kategorie Aufräumen.',target:24,metric:'tidy',title:'Franz Beckenkehrer',patch:'franz-beckenkehrer',outfit:null},
 {id:'kehrminator',name:'Kehrminator',description:'175 bestätigte Missionen insgesamt.',target:175,metric:'total',title:'Kehrminator',patch:'kehrminator',outfit:null},
 {id:'juergen-cleansman',name:'Jürgen Cleansman',description:'35 bestätigte Missionen in der Kategorie Küche.',target:35,metric:'kitchenCareer',title:'Jürgen Cleansman',patch:'juergen-cleansman',outfit:null},
 {id:'helene-wischer',name:'Helene Wischer',description:'30 bestätigte Missionen in der Kategorie Bad.',target:30,metric:'bath',title:'Helene Wischer',patch:'helene-wischer',outfit:null},
 {id:'george-cleaney',name:'George Cleaney',description:'Dein Wochenziel in neun Wochen erreichen. Pausen sind erlaubt.',target:9,metric:'weeks',title:'George Cleaney',patch:'george-cleaney',outfit:null},
 {id:'otto-von-wischmark',name:'Otto von Wischmark',description:'45 bestätigte Missionen in der Kategorie Haushalt.',target:45,metric:'household',title:'Otto von Wischmark',patch:'otto-von-wischmark',outfit:null},
 {id:'roberto-blanko',name:'Roberto Blanko',description:'35 bestätigte Missionen in der Kategorie Wäsche.',target:35,metric:'laundry',title:'Roberto Blanko',patch:'roberto-blanko',outfit:null},
 {id:'harry-putzer',name:'Harry Putzer',description:'75 bestätigte Missionen insgesamt. Kleine Taten wirken Wunder.',target:75,metric:'total',title:'Harry Putzer',patch:'harry-putzer',outfit:null},
 {id:'albert-reinstein',name:'Albert Reinstein',description:`In fünf Kategorien jeweils mindestens ${PRACTISED_CATEGORY_MIN} bestätigte Missionen. Du wählst die Kategorien.`,target:5,metric:'practisedCategories',title:'Albert Reinstein',patch:'albert-reinstein',outfit:null},
 {id:'clean-elisabeth',name:'Clean Elisabeth',description:'Dein Wochenziel in zwölf Wochen erreichen. Pausen sind erlaubt.',target:12,metric:'weeks',title:'Clean Elisabeth',patch:'clean-elisabeth',outfit:null},
] as const;
export function specialBadgeArt(id?:string|null){return SPECIAL_BADGES.some(a=>a.id===id)?`/art/badge-${id}.webp`:null;}
export function achievementCollections<T extends {id:string}>(items:T[]){const ids=new Set<string>(SPECIAL_BADGES.map(a=>a.id));return {milestones:items.filter(a=>!ids.has(a.id)),badges:items.filter(a=>ids.has(a.id))};}
export const ACHIEVEMENTS=[
 {id:'first',name:'Erster Einsatz',description:'Eine bestätigte Mission.',target:1,metric:'total',title:null,patch:null,outfit:null},
 {id:'steady',name:'Dranbleiber',description:'Zwölf bestätigte Missionen.',target:12,metric:'total',title:'Sternensammler',patch:'star',outfit:null},
 {id:'team',name:'Teamgeist',description:'Mindestens zwei aktive Crewmitglieder.',target:2,metric:'team',title:null,patch:null,outfit:null},
 {id:'kitchen',name:'Krümelkommandant',description:'Zwölf bestätigte Missionen in der Kategorie Küche.',target:12,metric:'kitchenCareer',title:'Krümelkommandant',patch:'comet',outfit:null},
 {id:'garden',name:'Gartenpilot',description:'Sechs bestätigte Missionen in der Kategorie Pflanzen.',target:6,metric:'plantsCareer',title:'Gartenpilot',patch:'leaf',outfit:'garden'},
 {id:'nebula',name:'Nebelläufer',description:'30 bestätigte Missionen.',target:30,metric:'total',title:'Nebelläufer',patch:'orbit',outfit:'nebula'},
 {id:'dust',name:'Staubbezwinger',description:'60 bestätigte Missionen.',target:60,metric:'total',title:'Staubbezwinger',patch:'dust',outfit:null},
 {id:'hero',name:'Haushaltsheld',description:'115 bestätigte Missionen.',target:115,metric:'total',title:'Haushaltsheld',patch:'crown',outfit:'captain'},
 {id:'wash',name:'Waschonaut',description:'Zwölf bestätigte Missionen in der Kategorie Wäsche.',target:12,metric:'laundry',title:'Waschonaut',patch:'wash',outfit:'wash'},
 {id:'shine',name:'Glanzpilot',description:'Zwölf bestätigte Missionen in der Kategorie Bad.',target:12,metric:'bath',title:'Glanzpilot',patch:'shine',outfit:'shine'},
 {id:'allround',name:'Allroundonaut',description:'Bestätigte Missionen aus sechs frei wählbaren Kategorien.',target:6,metric:'variety',title:'Allroundonaut',patch:'compass',outfit:'allround'},
 {id:'rhythm',name:'Im Rhythmus',description:'Dein Wochenziel in fünf Wochen erreichen. Pausen sind erlaubt.',target:5,metric:'weeks',title:'Stern im Alltag',patch:'polar',outfit:'polar'},
 ...SPECIAL_BADGES,
] as const;
export const GAME_OUTFITS=[{id:'starter',title:'Starter',cost:0,level:1,achievement:null},{id:'comet',title:'Komet',cost:350,level:1,achievement:null},{id:'sun',title:'Sonnenheld',cost:0,level:9,achievement:null},{id:'garden',title:'Gartenpilot',cost:0,level:1,achievement:'garden'},{id:'nebula',title:'Nebelläufer',cost:0,level:1,achievement:'nebula'},{id:'wash',title:'Waschonaut',cost:0,level:1,achievement:'wash'},{id:'shine',title:'Glanzpilot',cost:0,level:1,achievement:'shine'},{id:'allround',title:'Allroundonaut',cost:0,level:1,achievement:'allround'},{id:'polar',title:'Polarstern',cost:0,level:1,achievement:'rhythm'},{id:'captain',title:'Galaxiekapitän',cost:0,level:1,achievement:'hero'}];
export type AchievementId=typeof ACHIEVEMENTS[number]['id'];
export type AchievementProgress=typeof ACHIEVEMENTS[number]&{value:number;unlocked:boolean;applicable?:boolean};
export function nextAchievements<T extends {id:string;value:number;target:number;unlocked:boolean;applicable?:boolean}>(items:T[],focus?:string|null){
 return items.filter(a=>!a.unlocked&&a.applicable!==false).sort((a,b)=>Number(b.id===focus)-Number(a.id===focus)||(b.value/b.target)-(a.value/a.target)||a.target-b.target);
}
export function achievementHint(a:AchievementProgress){
 const left=Math.max(0,a.target-a.value),unit=a.metric==='weeks'?(left===1?'erreichte Zielwoche':'erreichte Zielwochen'):a.metric==='practisedCategories'?`${left===1?'weitere Kategorie':'weitere Kategorien'} mit je ${PRACTISED_CATEGORY_MIN} Missionen`:a.metric==='variety'?(left===1?'weitere Kategorie':'weitere Kategorien'):a.metric==='laundry'?(left===1?'Wäschemission':'Wäschemissionen'):a.metric==='bath'?(left===1?'Badezimmermission':'Badezimmermissionen'):a.metric==='kitchenCareer'?(left===1?'Küchenmission':'Küchenmissionen'):a.metric==='tidy'?(left===1?'Aufräummission':'Aufräummissionen'):a.metric==='household'?(left===1?'Mission in der Kategorie Haushalt':'Missionen in der Kategorie Haushalt'):a.metric==='plantsCareer'?(left===1?'Pflanzenmission':'Pflanzenmissionen'):a.metric==='team'?(left===1?'Crewmitglied':'Crewmitglieder'):(left===1?'Mission':'Missionen');
 const reward=GAME_OUTFITS.find(o=>o.id===a.outfit)?.title??a.name;
 return `Noch ${left} ${unit} bis ${reward}.`;
}
