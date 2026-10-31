import type {TaskIconId} from './task-icons.ts';
import {weekday} from './planning.ts';

export const HOUSEHOLD_TYPES = [
  { id: 'family', label: 'Familie', description: 'Große und kleine Putzonauten', placeholder: 'Zum Beispiel: Die Chaoscrew', goal: 24 },
  { id: 'couple', label: 'Zu zweit', description: 'Gemeinsam mehr Freizeit', placeholder: 'Zum Beispiel: Team Feierabend', goal: 14 },
  { id: 'shared', label: 'WG', description: 'Fair verteilt, zusammen geschafft', placeholder: 'Zum Beispiel: Galaktische WG', goal: 21 },
  { id: 'solo', label: 'Für mich', description: 'Dein Zuhause, dein Abenteuer', placeholder: 'Zum Beispiel: Meine Raumstation', goal: 7 },
] as const;
export type HouseholdKind = typeof HOUSEHOLD_TYPES[number]['id'];
export type TemplateCategory = 'kitchen'|'bath'|'laundry'|'tidy'|'household'|'plants'|'pets';
export const TEMPLATE_CATEGORIES: {id:TemplateCategory;label:string}[] = [
 {id:'kitchen',label:'Küche'}, {id:'bath',label:'Bad'}, {id:'laundry',label:'Wäsche'},
 {id:'tidy',label:'Aufräumen'}, {id:'household',label:'Haushalt'}, {id:'plants',label:'Pflanzen & draußen'}, {id:'pets',label:'Haustiere'},
];
export type TaskTemplate={key:string;title:string;room:string;icon:TaskIconId;minutes:number;xp:number;stars:number;cadence:'daily'|'weekly'|'once';category:TemplateCategory;steps?:string[];mental?:boolean;difficulty?:'easy'|'normal'|'hard'};
// Keep the familiar, small starter selection independent from the growing library.
export const STARTER_TEMPLATE_KEYS=['vacuum','dishes','laundry','plant','bath','trash'];
export const DEFAULT_STARTER_TEMPLATE_KEYS=['dishes','trash'];
export const TASK_TEMPLATES:TaskTemplate[] = [
  { key: 'vacuum', category:'tidy', title: 'Staubsaugen', room: 'Wohnen', icon: 'vacuum', minutes: 15, xp: 60, stars: 20, cadence: 'daily' },
  { key: 'dishes', category:'kitchen', title: 'Spülmaschine einräumen', room: 'Küche', icon: 'dishes', minutes: 8, xp: 30, stars: 10, cadence: 'daily' },
  { key: 'laundry', category:'laundry', title: 'Wäsche aufhängen', room: 'Haushalt', icon: 'laundry', minutes: 10, xp: 40, stars: 15, cadence: 'daily' },
  { key: 'plant', category:'plants', title: 'Pflanzen gießen', room: 'Wohnen', icon: 'plant', minutes: 5, xp: 20, stars: 5, cadence: 'weekly' },
  { key: 'bath', category:'bath', title: 'Waschbecken, Toilette und Badspiegel reinigen', room: 'Bad', icon: 'bath', minutes: 20, xp: 80, stars: 25, cadence: 'weekly', steps:['Waschbecken reinigen','Toilette reinigen','Badspiegel putzen'] },
  { key: 'trash', category:'household', title: 'Müll rausbringen', room: 'Haushalt', icon: 'trash', minutes: 5, xp: 20, stars: 5, cadence: 'daily' },
  {"key": "unload", "title": "Spülmaschine ausräumen", "room": "Küche", "icon": "dishes", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "kitchen"},
  {"key": "counter", "title": "Arbeitsfläche abwischen", "room": "Küche", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "kitchen"},
  {"key": "table", "title": "Esstisch abräumen und abwischen", "room": "Küche", "icon": "dishes", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "kitchen"},
  {"key": "sink", "title": "Küchenspüle reinigen", "room": "Küche", "icon": "dishes", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "kitchen"},
  {"key": "stove", "title": "Abgekühltes Kochfeld reinigen", "room": "Küche", "icon": "sparkles", "minutes": 10, "xp": 40, "stars": 15, "cadence": "weekly", "category": "kitchen"},
  {"key": "fridge-check", "mental": true, "title": "Kühlschrankvorräte prüfen", "room": "Küche", "icon": "dishes", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "kitchen"},
  {"key": "fridge-clean", "title": "Kühlschrank auswischen", "room": "Küche", "icon": "sparkles", "minutes": 20, "xp": 80, "stars": 25, "cadence": "once", "category": "kitchen", "steps": ["Fächer ausräumen", "Fächer und Ablagen auswischen und trocknen", "Lebensmittel wieder einräumen"]},
  {"key": "oven", "title": "Abgekühlten Backofen auswischen", "room": "Küche", "icon": "sparkles", "minutes": 20, "xp": 80, "stars": 25, "cadence": "once", "category": "kitchen"},
  {"key": "washbasin", "title": "Waschbecken reinigen", "room": "Bad", "icon": "bath", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "bath"},
  {"key": "mirror", "title": "Badspiegel putzen", "room": "Bad", "icon": "bath", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "bath"},
  {"key": "toilet", "title": "Toilette reinigen", "room": "Bad", "icon": "bath", "minutes": 10, "xp": 40, "stars": 15, "cadence": "weekly", "category": "bath"},
  {"key": "shower", "title": "Dusche reinigen", "room": "Bad", "icon": "bath", "minutes": 15, "xp": 60, "stars": 20, "cadence": "weekly", "category": "bath"},
  {"key": "towels", "title": "Handtücher wechseln", "room": "Bad", "icon": "laundry", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "bath"},
  {"key": "bath-bin", "title": "Badeimer leeren", "room": "Bad", "icon": "trash", "minutes": 3, "xp": 10, "stars": 5, "cadence": "weekly", "category": "bath"},
  {"key": "wash", "title": "Waschmaschine beladen", "room": "Haushalt", "icon": "laundry", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "laundry"},
  {"key": "fold", "title": "Wäsche zusammenlegen", "room": "Haushalt", "icon": "laundry", "minutes": 10, "xp": 40, "stars": 15, "cadence": "daily", "category": "laundry"},
  {"key": "put-laundry", "title": "Saubere Wäsche einräumen", "room": "Haushalt", "icon": "laundry", "minutes": 10, "xp": 40, "stars": 15, "cadence": "daily", "category": "laundry"},
  {"key": "bedding", "title": "Bett frisch beziehen", "room": "Wohnen", "icon": "laundry", "minutes": 15, "xp": 60, "stars": 20, "cadence": "weekly", "category": "laundry", "steps": ["Alte Bettwäsche abziehen", "Frische Bettwäsche aufziehen", "Alte Bettwäsche zum Wäschekorb bringen"]},
  {"key": "collect-laundry", "title": "Schmutzwäsche einsammeln", "room": "Haushalt", "icon": "laundry", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "laundry"},
  {"key": "shoes", "title": "Schuhe und Jacken wegräumen", "room": "Wohnen", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "tidy"},
  {"key": "toys", "title": "Spielzeug an seinen Platz räumen", "room": "Wohnen", "icon": "sparkles", "minutes": 10, "xp": 40, "stars": 15, "cadence": "daily", "category": "tidy"},
  {"key": "desk", "title": "Schreibtisch freiräumen", "room": "Wohnen", "icon": "sparkles", "minutes": 10, "xp": 40, "stars": 15, "cadence": "weekly", "category": "tidy"},
  {"key": "dust", "title": "Ein Regal abstauben", "room": "Wohnen", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "tidy"},
  {"key": "floor", "title": "Einen Raum feucht wischen", "room": "Wohnen", "icon": "vacuum", "minutes": 15, "xp": 60, "stars": 20, "cadence": "weekly", "category": "tidy"},
  {"key": "handles", "title": "Türgriffe abwischen", "room": "Haushalt", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "tidy"},
  {"key": "bed", "title": "Bett machen", "room": "Wohnen", "icon": "sparkles", "minutes": 3, "xp": 10, "stars": 5, "cadence": "daily", "category": "tidy"},
  {"key": "couch", "title": "Sofa und Kissen ordnen", "room": "Wohnen", "icon": "sparkles", "minutes": 3, "xp": 10, "stars": 5, "cadence": "daily", "category": "tidy"},
  {"key": "paper", "title": "Altpapier wegbringen", "room": "Haushalt", "icon": "trash", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "household"},
  {"key": "shopping-list", "mental": true, "title": "Einkaufsliste ergänzen", "room": "Haushalt", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "household"},
  {"key": "shopping-away", "title": "Einkäufe einräumen", "room": "Küche", "icon": "dishes", "minutes": 10, "xp": 40, "stars": 15, "cadence": "once", "category": "household"},
  {"key": "mail", "mental": true, "title": "Post sortieren", "room": "Haushalt", "icon": "sparkles", "minutes": 10, "xp": 40, "stars": 15, "cadence": "weekly", "category": "household"},
  {"key": "supplies", "mental": true, "title": "Haushaltsvorräte prüfen", "room": "Haushalt", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "household"},
  {"key": "leaves", "title": "Vertrocknete Blätter entfernen", "room": "Wohnen", "icon": "plant", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "plants"},
  {"key": "balcony", "title": "Balkon oder Terrasse fegen", "room": "Haushalt", "icon": "vacuum", "minutes": 10, "xp": 40, "stars": 15, "cadence": "weekly", "category": "plants"},
  {"key": "entry", "title": "Eingangsbereich fegen", "room": "Haushalt", "icon": "vacuum", "minutes": 5, "xp": 20, "stars": 5, "cadence": "weekly", "category": "plants"},
  {"key": "water-bowls", "title": "Wassernäpfe reinigen und auffüllen", "room": "Haushalt", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "pets"},
  {"key": "feed", "title": "Haustier nach Futterplan versorgen", "room": "Haushalt", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "pets"},
  {"key": "pet-place", "title": "Futterplatz sauber machen", "room": "Haushalt", "icon": "sparkles", "minutes": 5, "xp": 20, "stars": 5, "cadence": "daily", "category": "pets"},
  {"key": "litter", "title": "Katzentoilette säubern", "room": "Haushalt", "icon": "trash", "minutes": 10, "xp": 40, "stars": 15, "cadence": "daily", "category": "pets"},
  {key:'meal-plan',title:'Die Mahlzeiten der Woche planen',room:'Haushalt',icon:'sparkles',minutes:15,xp:60,stars:20,cadence:'weekly',category:'household',mental:true,difficulty:'normal',steps:['Wünsche und Termine berücksichtigen','Mahlzeiten auswählen','Fehlende Zutaten auf die Einkaufsliste setzen']},
  {key:'family-calendar',title:'Gemeinsame Termine abstimmen',room:'Haushalt',icon:'sparkles',minutes:10,xp:40,stars:15,cadence:'weekly',category:'household',mental:true},
  {key:'appointments',title:'Einen nötigen Termin organisieren',room:'Haushalt',icon:'sparkles',minutes:10,xp:40,stars:15,cadence:'once',category:'household',mental:true},
  {key:'school-bag',title:'Anstehende Schul- oder Kita-Dinge planen',room:'Haushalt',icon:'sparkles',minutes:10,xp:40,stars:15,cadence:'weekly',category:'household',mental:true},
  {key:'care-plan',title:'Betreuung und Fahrten abstimmen',room:'Haushalt',icon:'sparkles',minutes:15,xp:60,stars:20,cadence:'weekly',category:'household',mental:true},
  {key:'household-organize',title:'Eine Reparatur oder Wartung organisieren',room:'Haushalt',icon:'sparkles',minutes:15,xp:60,stars:20,cadence:'once',category:'household',mental:true},
] as const;

export const STARTER_TEMPLATES=TASK_TEMPLATES.filter(t=>STARTER_TEMPLATE_KEYS.includes(t.key));

/** New crews only. Existing goals and saved tasks are never recalculated. */
export function setupGoals(kind:HouseholdKind,keys:readonly string[],today:string){
 const tasks=TASK_TEMPLATES.filter(t=>keys.includes(t.key));
 const daysLeft=8-weekday(today);
 const recurringCapacity=tasks.reduce((sum,t)=>sum+(t.cadence==='daily'?7:t.cadence==='weekly'?1:0),0);
 const firstCapacity=tasks.reduce((sum,t)=>sum+(t.cadence==='daily'?daysLeft:1),0);
 const followingWeeks=Math.max(1,Math.min(HOUSEHOLD_TYPES.find(t=>t.id===kind)!.goal,recurringCapacity));
 // An empty start asks for the first own mission, never grants a free zero-goal week.
 const firstWeek=Math.max(1,Math.min(firstCapacity,Math.ceil(followingWeeks*daysLeft/7)));
 return {firstWeek,followingWeeks};
}
