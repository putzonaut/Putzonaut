import type {HouseholdKind} from './setup.ts';
import type {RewardIconId} from './reward-icons.ts';

export type RewardIdea={title:string;cost:number;icon:RewardIconId};
export const REWARD_IDEAS:Record<HouseholdKind,RewardIdea[]>={
 family:[
  {title:'Wunschessen',cost:100,icon:'meal'},
  {title:'Filmabend aussuchen',cost:150,icon:'film'},
  {title:'Eis-Ausflug',cost:120,icon:'ice'},
  {title:'Gemeinsamer Spieletag',cost:250,icon:'boardgame'},
  {title:'Lieblingsspiel gemeinsam spielen',cost:80,icon:'gamepad'},
  {title:'Eine extra Vorlesegeschichte',cost:60,icon:'book'},
  {title:'Picknick im Park',cost:180,icon:'meal'},
  {title:'Kekse nach Wunsch backen',cost:140,icon:'cookie'},
  {title:'Familienkino mit Popcorn',cost:200,icon:'film'},
  {title:'Ausflug ins Schwimmbad',cost:300,icon:'swim'},
  {title:'Eine kleine Schatzsuche',cost:160,icon:'trip'},
  {title:'Kreativnachmittag zusammen',cost:160,icon:'palette'},
  {title:'Lieblingsspielplatz besuchen',cost:100,icon:'trees'},
  {title:'Pizza gemeinsam belegen',cost:180,icon:'pizza'},
  {title:'Minigolf-Ausflug',cost:350,icon:'trip'},
  {title:'Ein Familienabenteuer planen',cost:500,icon:'trip'},
 ],
 couple:[
  {title:'Date-Abend planen lassen',cost:250,icon:'heart'},
  {title:'Lieblingsessen',cost:120,icon:'meal'},
  {title:'Film auswählen',cost:100,icon:'film'},
  {title:'Frühstück im Bett',cost:180,icon:'meal'},
  {title:'Kaffee-Date zu zweit',cost:80,icon:'coffee'},
  {title:'Spaziergang mit Lieblingseis',cost:100,icon:'ice'},
  {title:'Spieleabend zu zweit',cost:140,icon:'boardgame'},
  {title:'Ein neues Rezept gemeinsam kochen',cost:160,icon:'meal'},
  {title:'Serienabend mit Wunschsnacks',cost:150,icon:'film'},
  {title:'Picknick zum Sonnenuntergang',cost:200,icon:'meal'},
  {title:'Wellnessabend zu Hause',cost:220,icon:'wellness'},
  {title:'Gemeinsam ins Kino',cost:300,icon:'film'},
  {title:'Ein neues Café entdecken',cost:180,icon:'coffee'},
  {title:'Kleiner Ausflug ins Grüne',cost:280,icon:'trees'},
  {title:'Lieblingsrestaurant besuchen',cost:400,icon:'meal'},
  {title:'Einen gemeinsamen Erlebnistag planen',cost:500,icon:'ticket'},
 ],
 shared:[
  {title:'WG-Filmabend auswählen',cost:150,icon:'film'},
  {title:'Gemeinsam Pizza machen',cost:180,icon:'pizza'},
  {title:'WG-Spieleabend',cost:200,icon:'boardgame'},
  {title:'Eisrunde vereinbaren',cost:150,icon:'ice'},
  {title:'Wunschplaylist beim Kochen',cost:60,icon:'music'},
  {title:'Lieblingssnacks für den WG-Abend',cost:100,icon:'meal'},
  {title:'Gemeinsames Sonntagsfrühstück',cost:180,icon:'meal'},
  {title:'Eine neue Serie gemeinsam starten',cost:120,icon:'film'},
  {title:'Kartenspielrunde mit Snacks',cost:100,icon:'boardgame'},
  {title:'WG-Picknick im Park',cost:220,icon:'meal'},
  {title:'Kochabend mit Wunschrezept',cost:160,icon:'meal'},
  {title:'Karaokeabend zu Hause',cost:200,icon:'mic'},
  {title:'Gemeinsam ins Open-Air-Kino',cost:300,icon:'film'},
  {title:'WG-Ausflug zum Badesee',cost:280,icon:'swim'},
  {title:'Eine Runde Minigolf zusammen',cost:350,icon:'trip'},
  {title:'Gemeinsamen Erlebnistag planen',cost:500,icon:'ticket'},
 ],
 solo:[
  {title:'Zeit für meinen Lieblingsfilm',cost:120,icon:'film'},
  {title:'Mein Lieblingsessen',cost:100,icon:'meal'},
  {title:'Ein Ausflug für mich',cost:250,icon:'trip'},
  {title:'Eine Kugel Lieblingseis',cost:80,icon:'ice'},
  {title:'Eine gemütliche Lesestunde',cost:60,icon:'book'},
  {title:'Mein Lieblingsgetränk im Café',cost:100,icon:'coffee'},
  {title:'Zeit für mein Kreativprojekt',cost:120,icon:'palette'},
  {title:'Ein schöner Spieleabend für mich',cost:140,icon:'gamepad'},
  {title:'Ein neues Rezept ausprobieren',cost:150,icon:'meal'},
  {title:'Kinoabend mit Wunschsnacks',cost:180,icon:'film'},
  {title:'Mein kleiner Wellnessabend',cost:180,icon:'wellness'},
  {title:'Ein neues Buch aussuchen',cost:250,icon:'book'},
  {title:'Ein Museum entdecken',cost:280,icon:'ticket'},
  {title:'Kleines Extra für mein Hobby',cost:300,icon:'shopping'},
  {title:'Mein Lieblingsrestaurant besuchen',cost:350,icon:'meal'},
  {title:'Einen besonderen Tagesausflug planen',cost:500,icon:'trip'},
 ],
};
export const REWARD_BUDGETS=[{id:'all',label:'Alle Sterneziele'},{id:'small',label:'Bis 120 Sterne'},{id:'medium',label:'121–250 Sterne'},{id:'large',label:'Ab 251 Sterne'}] as const;
export type RewardBudget=typeof REWARD_BUDGETS[number]['id'];
const normalizeTitle=(title:string)=>title.trim().toLocaleLowerCase('de-DE').replace(/\s+/g,' ');
export function rewardIdeas(kind:HouseholdKind,existing:{title:string}[],query='',budget:RewardBudget='all'){
 const titles=new Set(existing.map(r=>normalizeTitle(r.title))),search=normalizeTitle(query);
 return REWARD_IDEAS[kind].filter(r=>!titles.has(normalizeTitle(r.title))&&normalizeTitle(r.title).includes(search)&&(budget==='all'||budget==='small'&&r.cost<=120||budget==='medium'&&r.cost>120&&r.cost<=250||budget==='large'&&r.cost>250));
}
